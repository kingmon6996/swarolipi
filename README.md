# Face and Gesture Detection

This Flask service uses MediaPipe Face Mesh to continuously track the webcam stream, require exactly one person in view, estimate eye gaze and head direction, and count blinks. It serves the webcam tester at `/`.

## Run the service

Install dependencies with `pip install -r requirements.txt`, then run `python app.py`. The webcam tester and service should be opened from the same host over HTTPS in production so the browser can grant camera access.

For a production WSGI server on Linux, use a threaded worker so WebSocket connections remain open:

```bash
gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 60 app:app
```

Each connected WebSocket creates a face tracker and retains blink state for that connection. Keep the worker count low to avoid loading duplicate models into memory.

The service requires separate PostgreSQL settings: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. Set them in the environment or `.env` file using the direct Supabase connection details. It does not fall back to SQLite; startup fails with a clear error if the database cannot be reached. Startup also adds the nullable `profile.identity_document_hash` column to an existing PostgreSQL profile table when needed.

## WebSocket stream

Connect to `/face/ws` using `ws://` locally or `wss://` over HTTPS. The webcam page displays the live camera feed and continuously sends binary JPEG frames over one persistent WebSocket, approximately every 150 ms. The server replies with one JSON message per processed frame:

```json
{
  "status": "SUCCESS",
  "message": "Exactly one person detected",
  "face_count": 1,
  "face": {"x": 100, "y": 40, "width": 240, "height": 300},
  "blink": {"detected": false, "count": 2},
  "gaze": "CENTER",
  "head": {"movement": "CENTER", "yaw": 0.0, "pitch": 0.0}
}
```

`status` is `FAILED` when no face is detected and `MULTIPLE` when more than one face is visible; only a single detected face receives `SUCCESS`. `gaze` estimates `LEFT`, `RIGHT`, `UP`, `DOWN`, or `CENTER` from iris landmarks. `head.movement` estimates head direction from pose angles. These are visual estimates, not identity or liveness guarantees. Text or invalid image messages return an `ERROR` response. Frames larger than 8 MiB are rejected.

`GET /health` returns `{"status":"ok"}`. Set `CORS_ORIGINS` to a comma-separated list of allowed browser origins; it defaults to `*`.

## Deploy the Sepolia registry and faucet

The deployment script compiles `SwarolipiFaucetRegistry.sol`, verifies the RPC is on Ethereum Sepolia and that the signing key belongs to `0xaB526f986D85b926d37a19ea11DC0E5bfcb3630d`, then deploys and saves the confirmed contract address and transaction details to `SwarolipiFaucetRegistry.deployment.json`. The wallet must hold enough Sepolia ETH to pay deployment gas. Set `SEPOLIA_PRIVATE_KEY` in the local, git-ignored `.env` file; optionally set `SEPOLIA_RPC_URL` to override the default public Sepolia RPC. Never share or commit the private key.

Install dependencies with `pip install -r requirements.txt`, then run `python deploy_faucet.py`. The script installs Solidity compiler 0.8.20 through `py-solc-x` if it is not already available. It will reuse the previously recorded deployment when code is present; pass `--redeploy` to intentionally deploy a new instance.

## OCR endpoint

Send an image as multipart form data in the `image` field to `POST /ocr`. The endpoint accepts image files up to 8 MiB and returns extracted document information as JSON:

The home page includes an OCR test panel to preview a selected image, submit it, and display the returned data.

```json
{
  "status": "SUCCESS",
  "data": {
    "document_type": "PAN",
    "name": "EXAMPLE NAME",
    "dob": "01/01/1990",
    "document_id": "ABCDE1234F",
    "identity_hash": "<64-character SHA-256 hex digest>"
  }
}
```

`identity_hash` is a SHA-256 digest generated from the extracted name, date of birth, and document ID. Invalid or missing images return a JSON `ERROR` response. OCR uses RapidOCR, installed from `requirements.txt`.

## Voice comparison WebSocket

Connect to `/human/ws` and send one JSON text message with exactly five base64-encoded WAV recordings in a `voices` array:

The home page has separate face and voice panels. The voice panel randomly selects five different reading prompts, records them one at a time from the microphone (up to 15 seconds each), and sends them for comparison once all five are recorded.

```json
{
  "voices": [
    "<base64 WAV recording 1>",
    "<base64 WAV recording 2>",
    "<base64 WAV recording 3>",
    "<base64 WAV recording 4>",
    "<base64 WAV recording 5>"
  ]
}
```

The response is a compact JSON verdict: `{"result":"Similar"}` when every unique voice pair scores above `0.25`, otherwise `{"result":"Different"}`. Each request message is limited to 32 MiB. Invalid JSON, recording counts, base64 data, or WAV audio return a JSON `ERROR` response. Voice comparison uses the ECAPA-TDNN model and its dependencies, installed with `pip install -r requirements.txt`.

The voice panel retrieves five newly generated tongue twisters from `POST /statements`. Add one or more OpenRouter API keys to the ignored `token.json` file as an array of objects, each with a `token` field; the endpoint tries them in order and moves to the next key when OpenRouter returns HTTP 401 or 403. `OPENROUTER_API_KEY` in the server environment or `.env` is also accepted as a final fallback. The endpoint calls OpenRouter's `openai/gpt-oss-120b` model and returns `{"status":"SUCCESS","statements":["...","...","...","...","..."]}`.
