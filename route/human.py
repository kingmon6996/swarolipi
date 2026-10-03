import base64
import binascii
import io
import json
import os
from pathlib import Path
from threading import Lock

from flask import Blueprint, request
from flask_sock import Sock


VOICE_COUNT = 5
MATCH_THRESHOLD = 0.25
MAX_WEBSOCKET_MESSAGE_BYTES = 32 * 1024 * 1024
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "*").split(",")
    if origin.strip()
}

human_blueprint = Blueprint("human", __name__)
sock = Sock()
_classifier = None
_classifier_lock = Lock()
_inference_lock = Lock()


def decode_voice_payload(message):
    try:
        payload = json.loads(message)
    except json.JSONDecodeError:
        return None, "Expected a JSON object containing five base64 WAV recordings"

    if not isinstance(payload, dict):
        return None, "Expected a JSON object containing five base64 WAV recordings"

    voices = payload.get("voices")
    if not isinstance(voices, list) or len(voices) != VOICE_COUNT:
        return None, "The 'voices' field must contain exactly five base64 WAV recordings"

    recordings = []
    for index, encoded_voice in enumerate(voices, start=1):
        if not isinstance(encoded_voice, str):
            return None, f"Voice {index} must be a base64-encoded WAV string"
        try:
            recording = base64.b64decode(encoded_voice, validate=True)
        except (binascii.Error, ValueError):
            return None, f"Voice {index} is not valid base64"
        if not recording:
            return None, f"Voice {index} is empty"
        recordings.append(recording)

    return recordings, None


def _get_classifier():
    global _classifier

    with _classifier_lock:
        if _classifier is None:
            from speechbrain.inference.speaker import EncoderClassifier
            from speechbrain.utils.fetching import LocalStrategy

            model_dir = (
                Path(__file__).resolve().parent.parent
                / "pretrained_models"
                / "spkrec-ecapa-voxceleb"
            )
            _classifier = EncoderClassifier.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir=str(model_dir),
                local_strategy=LocalStrategy.COPY,
            )
        return _classifier


def summarize_similarity(embeddings, cosine_similarity):
    for first in range(VOICE_COUNT):
        for second in range(first + 1, VOICE_COUNT):
            score = cosine_similarity(embeddings[first], embeddings[second]).item()
            if score <= MATCH_THRESHOLD:
                return {"result": "Different"}
    return {"result": "Similar"}


def compare_voices(recordings):
    import numpy as np
    import soundfile as sf
    import torch
    import torchaudio

    classifier = _get_classifier()
    embeddings = []
    for recording in recordings:
        try:
            samples, sample_rate = sf.read(
                io.BytesIO(recording),
                dtype="float32",
                always_2d=True,
            )
        except (RuntimeError, ValueError) as error:
            raise ValueError("Every voice must contain a valid WAV recording") from error

        if samples.size == 0 or not np.isfinite(samples).all():
            raise ValueError("WAV recordings must contain finite, non-empty audio")

        signal = torch.from_numpy(samples.mean(axis=1)).unsqueeze(0)
        if sample_rate != 16000:
            signal = torchaudio.functional.resample(
                signal,
                orig_freq=sample_rate,
                new_freq=16000,
            )

        with _inference_lock, torch.no_grad():
            embedding = classifier.encode_batch(signal).squeeze(0).squeeze(0)
        embeddings.append(embedding)

    cosine_similarity = torch.nn.CosineSimilarity(dim=0, eps=1e-6)
    return summarize_similarity(embeddings, cosine_similarity)


@sock.route("/ws", bp=human_blueprint)
def compare_voice_stream(ws):
    origin = request.headers.get("Origin")
    if origin and "*" not in ALLOWED_ORIGINS and origin not in ALLOWED_ORIGINS:
        ws.close(1008, "Origin not allowed")
        return

    while True:
        message = ws.receive()
        if message is None:
            return
        if not isinstance(message, str):
            ws.send(json.dumps({
                "status": "ERROR",
                "message": "Expected a JSON text message, not binary data",
            }))
            continue

        recordings, error = decode_voice_payload(message)
        if error:
            ws.send(json.dumps({"status": "ERROR", "message": error}))
            continue

        try:
            result = compare_voices(recordings)
        except ImportError:
            ws.send(json.dumps({
                "status": "ERROR",
                "message": (
                    "Voice comparison dependencies are unavailable; "
                    "install the project requirements"
                ),
            }))
            continue
        except ValueError as error:
            ws.send(json.dumps({"status": "ERROR", "message": str(error)}))
            continue

        ws.send(json.dumps(result))
