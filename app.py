import os
from pathlib import Path
from threading import Lock

import cv2
import numpy as np
import onnxruntime as ort
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from insightface.app import FaceAnalysis


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = int(os.environ.get("MAX_UPLOAD_BYTES", 8 * 1024 * 1024))

CORS(app, resources={r"/verify-stream": {"origins": os.environ.get("CORS_ORIGINS", "*").split(",")}})

session_options = ort.SessionOptions()
session_options.intra_op_num_threads = int(os.environ.get("ONNX_INTRA_OP_THREADS", "1"))
session_options.inter_op_num_threads = 1
session_options.add_session_config_entry("session.intra_op.allow_spinning", "0")
session_options.add_session_config_entry("session.inter_op.allow_spinning", "0")

face_analyzer = FaceAnalysis(
    name=os.environ.get("INSIGHTFACE_MODEL", "buffalo_l"),
    allowed_modules=["detection"],
    providers=["CPUExecutionProvider"],
    sess_options=session_options,
)
face_analyzer.prepare(ctx_id=-1, det_size=(640, 640))
inference_lock = Lock()


@app.route('/')
def index():
    return send_file(Path(__file__).resolve().with_name("index.html"))


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"status": "ERROR", "message": "Image exceeds the upload size limit"}), 413


@app.route('/verify-stream', methods=['POST'])
def verify_stream():

    uploaded_image = request.files.get("image")
    if uploaded_image is None:
        return jsonify({
            "status": "ERROR",
            "message": "Missing image file; upload it using the 'image' field"
        }), 400

    file_bytes = np.frombuffer(uploaded_image.read(), dtype=np.uint8)
    try:
        frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    except cv2.error:
        frame = None

    if frame is None:
        return jsonify({
            "status": "ERROR",
            "message": "Corrupted frame state"
        }), 400

    with inference_lock:
        faces = face_analyzer.get(frame)

    if len(faces) == 0:
        return jsonify({
            "status": "FAILED",
            "reason": "No face detected"
        }), 200

    detected_face = max(
        faces,
        key=lambda face: (
            (face.bbox[2] - face.bbox[0]) * (face.bbox[3] - face.bbox[1])
        ),
    )
    x1, y1, x2, y2 = detected_face.bbox
    x = max(0, int(x1))
    y = max(0, int(y1))
    right = min(frame.shape[1], int(x2))
    bottom = min(frame.shape[0], int(y2))

    return jsonify({
        "status": "SUCCESS",
        "message": "Human face detected",
        "face": {
            "x": int(x),
            "y": int(y),
            "width": max(0, right - x),
            "height": max(0, bottom - y),
            "confidence": float(detected_face.det_score),
        }
    }), 200


if __name__ == "__main__":
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', '24717')),
        debug=False,
        threaded=True,
    )
