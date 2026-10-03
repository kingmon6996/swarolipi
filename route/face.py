import json
import math
import os
import time

import cv2
import mediapipe as mp
import numpy as np
from flask import Blueprint, request
from flask_sock import Sock


MAX_FRAME_BYTES = 8 * 1024 * 1024
LEFT_EYE = (33, 160, 158, 133, 153, 144)
RIGHT_EYE = (362, 385, 387, 263, 373, 380)
LEFT_IRIS_CENTER = 468
RIGHT_IRIS_CENTER = 473
GAZE_LEFT_THRESHOLD = 0.35
GAZE_RIGHT_THRESHOLD = 0.65
GAZE_UP_THRESHOLD = 0.28
GAZE_DOWN_THRESHOLD = 0.72
HEAD_YAW_THRESHOLD = 12
HEAD_PITCH_THRESHOLD = 12
CLOSED_EAR_THRESHOLD = 0.20
OPEN_EAR_THRESHOLD = 0.24
MIN_BLINK_DURATION = 0.06
MAX_BLINK_DURATION = 0.50
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "*").split(",")
    if origin.strip()
}

face_blueprint = Blueprint("face", __name__)
sock = Sock()


def eye_aspect_ratio(points, indices):
    vertical_a = math.dist(points[indices[1]], points[indices[5]])
    vertical_b = math.dist(points[indices[2]], points[indices[4]])
    horizontal = math.dist(points[indices[0]], points[indices[3]])
    if horizontal <= 1e-6:
        return None
    return (vertical_a + vertical_b) / (2 * horizontal)


def classify_gaze(points):
    eye_measurements = (
        (LEFT_IRIS_CENTER, 33, 133, 159, 145),
        (RIGHT_IRIS_CENTER, 362, 263, 386, 374),
    )
    horizontal_positions = []
    vertical_positions = []
    for iris_id, corner_a, corner_b, upper_id, lower_id in eye_measurements:
        left_corner = min(points[corner_a][0], points[corner_b][0])
        right_corner = max(points[corner_a][0], points[corner_b][0])
        eye_width = right_corner - left_corner
        eye_height = points[lower_id][1] - points[upper_id][1]
        if eye_width <= 1e-6 or eye_height <= 1e-6:
            continue
        horizontal_positions.append(
            (points[iris_id][0] - left_corner) / eye_width
        )
        vertical_positions.append(
            (points[iris_id][1] - points[upper_id][1]) / eye_height
        )

    if not horizontal_positions or not vertical_positions:
        return "UNKNOWN"

    horizontal = sum(horizontal_positions) / len(horizontal_positions)
    vertical = sum(vertical_positions) / len(vertical_positions)
    if horizontal < GAZE_LEFT_THRESHOLD:
        return "LEFT"
    if horizontal > GAZE_RIGHT_THRESHOLD:
        return "RIGHT"
    if vertical < GAZE_UP_THRESHOLD:
        return "UP"
    if vertical > GAZE_DOWN_THRESHOLD:
        return "DOWN"
    return "CENTER"


def head_pose(points, width, height):
    image_points = np.array(
        [points[index] for index in (1, 152, 33, 263, 61, 291)],
        dtype=np.float64,
    )
    model_points = np.array(
        [
            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0, -150.0, -125.0),
        ],
        dtype=np.float64,
    )
    focal_length = float(width)
    camera_matrix = np.array(
        [
            [focal_length, 0.0, width / 2],
            [0.0, focal_length, height / 2],
            [0.0, 0.0, 1.0],
        ],
        dtype=np.float64,
    )
    success, rotation_vector, _ = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        np.zeros((4, 1), dtype=np.float64),
        flags=cv2.SOLVEPNP_ITERATIVE,
    )
    if not success:
        return None

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    yaw = math.degrees(math.atan2(-rotation_matrix[2, 0], math.hypot(
        rotation_matrix[0, 0], rotation_matrix[1, 0]
    )))
    pitch = math.degrees(math.atan2(
        rotation_matrix[2, 1], rotation_matrix[2, 2]
    ))
    if yaw < -HEAD_YAW_THRESHOLD:
        movement = "LEFT"
    elif yaw > HEAD_YAW_THRESHOLD:
        movement = "RIGHT"
    elif pitch < -HEAD_PITCH_THRESHOLD:
        movement = "UP"
    elif pitch > HEAD_PITCH_THRESHOLD:
        movement = "DOWN"
    else:
        movement = "CENTER"

    return {
        "movement": movement,
        "yaw": round(yaw, 1),
        "pitch": round(pitch, 1),
    }


class BlinkDetector:
    def __init__(self):
        self.count = 0
        self.closed_since = None
        self.ready = False

    def update(self, left_ear, right_ear, now):
        both_open = (
            left_ear >= OPEN_EAR_THRESHOLD
            and right_ear >= OPEN_EAR_THRESHOLD
        )
        both_closed = (
            left_ear <= CLOSED_EAR_THRESHOLD
            and right_ear <= CLOSED_EAR_THRESHOLD
        )
        if not self.ready:
            self.ready = both_open
            return False
        if self.closed_since is None:
            if both_closed:
                self.closed_since = now
            return False
        if not both_open:
            return False

        duration = now - self.closed_since
        self.closed_since = None
        if MIN_BLINK_DURATION <= duration <= MAX_BLINK_DURATION:
            self.count += 1
            return True
        return False


class FaceAnalyzer:
    def __init__(self):
        self.mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=2,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )
        self.blinks = BlinkDetector()

    def analyze(self, frame):
        height, width = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.mesh.process(rgb)
        faces = result.multi_face_landmarks or []
        face_count = len(faces)
        analysis = {
            "face_count": face_count,
            "face": None,
            "blink": {"detected": False, "count": self.blinks.count},
            "gaze": "UNKNOWN",
            "head": None,
        }
        if face_count != 1:
            self.blinks.closed_since = None
            return analysis

        landmarks = faces[0].landmark
        points = [(landmark.x * width, landmark.y * height) for landmark in landmarks]
        xs, ys = zip(*points)
        left, top = max(0, int(min(xs))), max(0, int(min(ys)))
        right, bottom = min(width, int(max(xs))), min(height, int(max(ys)))
        analysis["face"] = {
            "x": left,
            "y": top,
            "width": max(0, right - left),
            "height": max(0, bottom - top),
        }

        left_ear = eye_aspect_ratio(points, LEFT_EYE)
        right_ear = eye_aspect_ratio(points, RIGHT_EYE)
        if left_ear is not None and right_ear is not None:
            blink_detected = self.blinks.update(
                left_ear,
                right_ear,
                time.monotonic(),
            )
            analysis["blink"] = {
                "detected": blink_detected,
                "count": self.blinks.count,
            }
        analysis["gaze"] = classify_gaze(points)
        analysis["head"] = head_pose(points, width, height)
        return analysis

    def close(self):
        self.mesh.close()


@sock.route("/ws", bp=face_blueprint)
def stream_faces(ws):
    origin = request.headers.get("Origin")
    if (
        origin
        and "*" not in ALLOWED_ORIGINS
        and origin not in ALLOWED_ORIGINS
    ):
        ws.close(1008, "Origin not allowed")
        return

    analyzer = FaceAnalyzer()
    try:
        while True:
            message = ws.receive()
            if message is None:
                break
            if not isinstance(message, bytes) or not message:
                ws.send(json.dumps({
                    "status": "ERROR",
                    "message": "Expected a binary JPEG video frame",
                }))
                continue
            if len(message) > MAX_FRAME_BYTES:
                ws.send(json.dumps({
                    "status": "ERROR",
                    "message": "Frame exceeds the upload size limit",
                }))
                continue

            encoded = np.frombuffer(message, dtype=np.uint8)
            try:
                frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
            except cv2.error:
                frame = None

            if frame is None:
                ws.send(json.dumps({
                    "status": "ERROR",
                    "message": "Invalid video frame",
                }))
                continue

            analysis = analyzer.analyze(frame)
            face_count = analysis["face_count"]
            status = "SUCCESS" if face_count == 1 else (
                "MULTIPLE" if face_count > 1 else "FAILED"
            )
            if face_count == 1:
                message_text = "Exactly one person detected"
            elif face_count > 1:
                message_text = "Only one person may be in the camera"
            else:
                message_text = "No person detected"
            ws.send(json.dumps({
                "status": status,
                "message": message_text,
                "face_count": face_count,
                "face": analysis["face"],
                "blink": analysis["blink"],
                "gaze": analysis["gaze"],
                "head": analysis["head"],
            }))
    finally:
        analyzer.close()
