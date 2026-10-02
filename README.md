# Human Face Detection API

This Flask service detects faces in uploaded images using InsightFace's `buffalo_l` detector. It also serves a webcam test page at `/`. It detects faces only; it does not identify or verify a person's identity.

## Run the service

Install dependencies with `pip install -r requirements.txt`, then run `python app.py`. On first start, InsightFace downloads the `buffalo_l` model pack into its model cache. For a production WSGI server on Linux, use one worker and a small thread pool:

```bash
gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 60 app:app
```

One worker avoids loading a separate copy of the model for each process. Inference is serialized within that process to limit CPU use, while up to four requests can be handled concurrently. Set `ONNX_INTRA_OP_THREADS` to change the ONNX Runtime CPU thread count; it defaults to `1`.

## API

`POST /verify-stream` accepts one image as multipart form data under the `image` field.

```bash
curl -X POST "https://YOUR-HOST/verify-stream" \
  -F "image=@frame.jpg"
```

The endpoint accepts each video frame as a separate request, so clients can stream by sending JPEG frames repeatedly. The response is JSON. `status` is `SUCCESS` when a face is detected, or `FAILED` otherwise; a successful response includes the largest face's bounding box and detection confidence. Invalid or missing images return an HTTP 400 response. `GET /health` returns `{"status":"ok"}` when the service is available.

The service also serves a webcam tester at `/`. Open it over HTTPS and allow camera access.

Set `CORS_ORIGINS` to a comma-separated list of allowed origins when calling the API from another website. It defaults to `*`. Set `MAX_UPLOAD_BYTES` to change the maximum image upload size; the default is 8 MiB.

The InsightFace model pack is published for non-commercial research use. Confirm its license is suitable for your use before deploying it commercially.
