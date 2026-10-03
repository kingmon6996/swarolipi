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
MOUTH_TOP = 13
MOUTH_BOTTOM = 14
MOUTH_LEFT = 78
MOUTH_RIGHT = 308
CLOSED_EAR_THRESHOLD = 0.20
OPEN_EAR_THRESHOLD = 0.24
MIN_BLINK_DURATION = 0.06
MAX_BLINK_DURATION = 0.50
MOUTH_OPEN_THRESHOLD = 0.18
MOUTH_CLOSED_THRESHOLD = 0.12
POSE_VISIBILITY_THRESHOLD = 0.55
HAND_RAISE_MARGIN = 0.03
HAND_LOWER_MARGIN = 0.02
FINGER_EXTENDED_ANGLE = 150
FINGER_CURLED_ANGLE = 130
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


def mouth_aspect_ratio(points):
    mouth_height = math.dist(points[MOUTH_TOP], points[MOUTH_BOTTOM])
    mouth_width = math.dist(points[MOUTH_LEFT], points[MOUTH_RIGHT])
    if mouth_width <= 1e-6:
        return None
    return mouth_height / mouth_width


def joint_angle(first, joint, last):
    first_vector = (first.x - joint.x, first.y - joint.y)
    last_vector = (last.x - joint.x, last.y - joint.y)
    first_length = math.hypot(*first_vector)
    last_length = math.hypot(*last_vector)
    if first_length <= 1e-6 or last_length <= 1e-6:
        return None
    cosine = (
        first_vector[0] * last_vector[0] + first_vector[1] * last_vector[1]
    ) / (first_length * last_length)
    return math.degrees(math.acos(max(-1.0, min(1.0, cosine))))


def classify_hand_shape(hand_landmarks):
    landmarks = hand_landmarks.landmark
    finger_joints = ((5, 6, 8), (9, 10, 12), (13, 14, 16), (17, 18, 20))
    angles = [
        joint_angle(landmarks[mcp], landmarks[pip], landmarks[tip])
        for mcp, pip, tip in finger_joints
    ]
    valid_angles = [angle for angle in angles if angle is not None]
    if len(valid_angles) < 3:
        return "TRACKING"

    extended = sum(angle >= FINGER_EXTENDED_ANGLE for angle in valid_angles)
    curled = sum(angle <= FINGER_CURLED_ANGLE for angle in valid_angles)
    if extended >= 3:
        return "OPEN"
    if curled >= 3:
        return "CLOSED"
    return "PARTIAL"


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


class DebouncedBoolean:
    def __init__(self, initial=False, required_frames=3):
        self.value = initial
        self.pending = None
        self.frames = 0
        self.required_frames = required_frames

    def update(self, candidate):
        if candidate is None or candidate == self.value:
            self.pending = None
            self.frames = 0
            return self.value
        if candidate == self.pending:
            self.frames += 1
        else:
            self.pending = candidate
            self.frames = 1
        if self.frames >= self.required_frames:
            self.value = candidate
            self.pending = None
            self.frames = 0
        return self.value


class HandShapeState:
    def __init__(self):
        self.shape = "TRACKING"
        self.pending = None
        self.frames = 0

    def update(self, shape):
        if shape == "TRACKING" or shape == self.shape:
            self.pending = None
            self.frames = 0
            return self.shape
        if shape == self.pending:
            self.frames += 1
        else:
            self.pending = shape
            self.frames = 1
        if self.frames >= 3:
            self.shape = shape
            self.pending = None
            self.frames = 0
        return self.shape

    def reset(self):
        self.shape = "TRACKING"
        self.pending = None
        self.frames = 0


def hand_above_shoulder(pose_landmarks, currently_raised):
    if pose_landmarks is None:
        return None
    pose_api = mp.solutions.pose
    pose = pose_landmarks.landmark
    sides = (
        (pose_api.PoseLandmark.LEFT_SHOULDER, pose_api.PoseLandmark.LEFT_WRIST),
        (pose_api.PoseLandmark.RIGHT_SHOULDER, pose_api.PoseLandmark.RIGHT_WRIST),
    )
    visible_sides = []
    margin = HAND_LOWER_MARGIN if currently_raised else HAND_RAISE_MARGIN
    for shoulder_id, wrist_id in sides:
        shoulder = pose[shoulder_id.value]
        wrist = pose[wrist_id.value]
        if (
            shoulder.visibility >= POSE_VISIBILITY_THRESHOLD
            and wrist.visibility >= POSE_VISIBILITY_THRESHOLD
        ):
            visible_sides.append(wrist.y < shoulder.y - margin)
    return any(visible_sides) if visible_sides else None


class GestureAnalyzer:
    def __init__(self):
        self.holistic = mp.solutions.holistic.Holistic(
            model_complexity=1,
            smooth_landmarks=True,
            refine_face_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )
        self.blinks = BlinkDetector()
        self.mouth = DebouncedBoolean()
        self.hand_raised = DebouncedBoolean()
        self.hand_shapes = {
            "left": HandShapeState(),
            "right": HandShapeState(),
        }

    def analyze(self, frame):
        height, width = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.holistic.process(rgb)
        now = time.monotonic()
        face = None
        blink_detected = False
        mouth_open = None

        if result.face_landmarks:
            points = [
                (landmark.x * width, landmark.y * height)
                for landmark in result.face_landmarks.landmark
            ]
            xs, ys = zip(*points)
            left, top = max(0, int(min(xs))), max(0, int(min(ys)))
            right, bottom = min(width, int(max(xs))), min(height, int(max(ys)))
            face = {
                "x": left,
                "y": top,
                "width": max(0, right - left),
                "height": max(0, bottom - top),
            }
            left_ear = eye_aspect_ratio(points, LEFT_EYE)
            right_ear = eye_aspect_ratio(points, RIGHT_EYE)
            if left_ear is not None and right_ear is not None:
                blink_detected = self.blinks.update(left_ear, right_ear, now)
            ratio = mouth_aspect_ratio(points)
            if ratio is not None:
                mouth_open = self.mouth.update(
                    ratio >= MOUTH_OPEN_THRESHOLD
                    if not self.mouth.value
                    else False if ratio <= MOUTH_CLOSED_THRESHOLD else None
                )
        else:
            self.blinks.closed_since = None

        raised = hand_above_shoulder(
            result.pose_landmarks,
            self.hand_raised.value,
        )
        raised_state = self.hand_raised.update(raised)
        hands = {}
        for side, landmarks in (
            ("left", result.left_hand_landmarks),
            ("right", result.right_hand_landmarks),
        ):
            if landmarks is None:
                self.hand_shapes[side].reset()
            else:
                hands[side] = self.hand_shapes[side].update(
                    classify_hand_shape(landmarks)
                )

        return {
            "face": face,
            "blink": {"detected": blink_detected, "count": self.blinks.count},
            "mouth": (
                "OPEN" if mouth_open else "CLOSED"
            ) if mouth_open is not None else None,
            "hand_raised": raised_state if raised is not None else None,
            "hands": hands,
        }

    def close(self):
        self.holistic.close()


@sock.route("/ws", bp=face_blueprint)
def stream_gestures(ws):
    origin = request.headers.get("Origin")
    if (
        origin
        and "*" not in ALLOWED_ORIGINS
        and origin not in ALLOWED_ORIGINS
    ):
        ws.close(1008, "Origin not allowed")
        return

    analyzer = GestureAnalyzer()
    try:
        while True:
            message = ws.receive()
            if message is None:
                break
            if not isinstance(message, bytes) or not message:
                ws.send(json.dumps({
                    "status": "ERROR",
                    "message": "Expected a binary JPEG frame",
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
                    "message": "Invalid image frame",
                }))
                continue

            analysis = analyzer.analyze(frame)
            face = analysis["face"]
            ws.send(json.dumps({
                "status": "SUCCESS" if face is not None else "FAILED",
                "message": (
                    "Human face detected" if face is not None else "No face detected"
                ),
                "face": face,
                "blink": analysis["blink"],
                "mouth": analysis["mouth"],
                "hand_raised": analysis["hand_raised"],
                "hands": analysis["hands"],
                "hands_visible": bool(analysis["hands"]),
            }))
    finally:
        analyzer.close()
