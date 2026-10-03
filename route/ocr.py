import hashlib
import json
import re
import cv2
import numpy as np
from datetime import datetime
from flask import Blueprint, jsonify, request
from rapidocr_onnxruntime import RapidOCR


MAX_IMAGE_BYTES = 8 * 1024 * 1024

ocr_blueprint = Blueprint("ocr", __name__)
_ocr_engine = None


def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = RapidOCR()
    return _ocr_engine



def preprocess(image_path):
    if isinstance(image_path, np.ndarray):
        image = image_path.copy()
    else:
        image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError(f"Cannot read image: {image_path}")

    width = image.shape[1]

    if width < 1200:
        scale = 1200 / width

        image = cv2.resize(
            image,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC
        )

    return image


def run_ocr(image_path):
    image = preprocess(image_path)

    result, _ = get_ocr_engine()(image)

    if not result:
        return ""

    lines = []

    for item in result:
        lines.append(str(item[1]).strip())

    return "\n".join(lines)


# ============================================================
# NORMALIZATION
# ============================================================

def normalize(text):
    text = text.upper()

    text = text.replace("|", "I")
    text = text.replace("—", "-")
    text = text.replace("–", "-")

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# DOCUMENT DETECTION
# ============================================================

def detect_document(text):

    upper = text.upper()

    if (
        "INCOME TAX DEPARTMENT" in upper
        or "PERMANENT ACCOUNT NUMBER" in upper
        or "INCOME TAX" in upper
        or re.search(r"\bPAN\b", upper)
    ):
        return "PAN"

    if (
        "ELECTION COMMISSION" in upper
        or "ELECTION COMMISSION OF INDIA" in upper
        or "ELECTOR" in upper
        or "EPIC" in upper
        or "VOTER" in upper
    ):
        return "VOTER"

    if (
        "AADHAAR" in upper
        or "UIDAI" in upper
        or "UNIQUE IDENTIFICATION AUTHORITY" in upper
    ):
        return "AADHAAR"

    if (
        "PASSPORT" in upper
        or "REPUBLIC OF INDIA" in upper
        or "P<IND" in upper
    ):
        return "PASSPORT"

    if extract_pan(text):
        return "PAN"

    if extract_aadhaar(text):
        return "AADHAAR"

    if extract_voter(text):
        return "VOTER"

    if extract_passport(text):
        return "PASSPORT"

    return "UNKNOWN"


# ============================================================
# PAN ID
# ============================================================

def extract_pan(text):

    text = normalize(text)

    match = re.search(
        r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
        text
    )

    return match.group(0) if match else None


# ============================================================
# AADHAAR ID
# ============================================================

def extract_aadhaar(text):

    text = normalize(text)

    match = re.search(
        r"\b[0-9]{4}\s[0-9]{4}\s[0-9]{4}\b",
        text
    )

    if match:
        return match.group(0)

    match = re.search(
        r"\b[0-9]{12}\b",
        text
    )

    return match.group(0) if match else None


# ============================================================
# VOTER ID
# ============================================================

def extract_voter(text):

    text = normalize(text)

    # Standard EPIC format
    match = re.search(
        r"\b[A-Z]{3}[0-9]{7}\b",
        text
    )

    if match:
        return match.group(0)

    # OCR fallback
    match = re.search(
        r"\b[A-Z]{2,4}[0-9]{6,10}\b",
        text
    )

    return match.group(0) if match else None


# ============================================================
# PASSPORT ID
# ============================================================

def extract_passport(text):

    text = normalize(text)

    match = re.search(
        r"\b[A-Z][0-9]{7}\b",
        text
    )

    return match.group(0) if match else None


# ============================================================
# DATE VALIDATION
# ============================================================

def valid_date(date_string):

    formats = [
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d.%m.%Y",
        "%d/%m/%y",
        "%d-%m-%y",
        "%d.%m.%y",
        "%Y-%m-%d"
    ]

    for fmt in formats:

        try:

            date = datetime.strptime(
                date_string,
                fmt
            )

            if date > datetime.now():
                return False

            if date.year < 1900:
                return False

            return True

        except ValueError:
            pass

    return False


def normalize_date(date_string):

    value = date_string.strip()

    value = value.replace(
        ".",
        "/"
    )

    value = value.replace(
        "-",
        "/"
    )

    # YYYY/MM/DD -> DD/MM/YYYY
    match = re.fullmatch(
        r"(\d{4})/(\d{2})/(\d{2})",
        value
    )

    if match:

        year, month, day = match.groups()

        value = f"{day}/{month}/{year}"

    # DD/MM/YY -> DD/MM/YYYY
    match = re.fullmatch(
        r"(\d{2})/(\d{2})/(\d{2})",
        value
    )

    if match:

        day, month, year = match.groups()

        year = int(year)

        if year <= 30:
            year += 2000
        else:
            year += 1900

        value = f"{day}/{month}/{year}"

    if valid_date(value):
        return value

    return None


def find_dates(text):

    patterns = [
        r"\b\d{2}[/-]\d{2}[/-]\d{4}\b",
        r"\b\d{2}\.\d{2}\.\d{4}\b",
        r"\b\d{4}[/-]\d{2}[/-]\d{2}\b",
        r"\b\d{2}[/-]\d{2}[/-]\d{2}\b",
        r"\b\d{2}\.\d{2}\.\d{2}\b"
    ]

    dates = []

    for pattern in patterns:

        for match in re.finditer(
            pattern,
            text
        ):

            value = normalize_date(
                match.group(0)
            )

            if value:
                dates.append(value)

    return dates


# ============================================================
# DOB EXTRACTION
# ============================================================

def extract_dob(text, document_type):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    labels = [
        r"DATE\s+OF\s+BIRTH",
        r"DOB",
        r"D\.O\.B",
        r"D\s+O\s+B",
        r"BIRTH\s+DATE"
    ]

    # --------------------------------------------------------
    # Search labelled DOB
    # --------------------------------------------------------

    for i, line in enumerate(lines):

        upper = line.upper()

        if any(
            re.search(
                label,
                upper
            )
            for label in labels
        ):

            # Same line
            dates = find_dates(line)

            if dates:
                return dates[0]

            # Next line
            if i + 1 < len(lines):

                dates = find_dates(
                    lines[i + 1]
                )

                if dates:
                    return dates[0]

            # Two lines after
            if i + 2 < len(lines):

                combined = (
                    lines[i + 1]
                    + " "
                    + lines[i + 2]
                )

                dates = find_dates(
                    combined
                )

                if dates:
                    return dates[0]

    # --------------------------------------------------------
    # Aadhaar Year of Birth
    # --------------------------------------------------------

    if document_type == "AADHAAR":

        for i, line in enumerate(lines):

            upper = line.upper()

            if (
                "YEAR OF BIRTH" in upper
                or "YOB" in upper
            ):

                match = re.search(
                    r"\b(19|20)\d{2}\b",
                    line
                )

                if match:
                    return match.group(0)

                if i + 1 < len(lines):

                    match = re.search(
                        r"\b(19|20)\d{2}\b",
                        lines[i + 1]
                    )

                    if match:
                        return match.group(0)

    # --------------------------------------------------------
    # Safe fallback
    # --------------------------------------------------------

    all_dates = find_dates(text)

    if len(all_dates) == 1:
        return all_dates[0]

    return None


# ============================================================
# NAME HELPERS
# ============================================================

def clean_name(name):

    name = name.upper().strip()

    name = re.sub(
        r"[^A-Z .'-]",
        "",
        name
    )

    name = re.sub(
        r"\s+",
        " ",
        name
    )

    return name.strip(" .-")


def is_valid_name(name):

    name = clean_name(name)

    if not name:
        return False

    words = name.split()

    if len(words) < 2:
        return False

    invalid_words = {
        "NAME",
        "ELECTOR",
        "ELECTORS",
        "FATHER",
        "FATHERS",
        "MOTHER",
        "MOTHERS",
        "HUSBAND",
        "HUSBANDS",
        "WIFE",
        "WIVES",
        "GOVT",
        "GOVERNMENT",
        "INDIA",
        "DEPARTMENT",
        "INCOME",
        "TAX",
        "PERMANENT",
        "ACCOUNT",
        "NUMBER",
        "DATE",
        "BIRTH",
        "DOB",
        "ELECTION",
        "COMMISSION",
        "PASSPORT",
        "REPUBLIC",
        "AUTHORITY",
        "UNIQUE",
        "IDENTIFICATION",
        "CARD",
        "IDENTITY",
        "ADDRESS",
        "MALE",
        "FEMALE",
        "YEAR",
        "BORN"
    }

    for word in words:

        if word in invalid_words:
            return False

    for word in words:

        if not re.fullmatch(
            r"[A-Z.'-]+",
            word
        ):
            return False

    return True


# ============================================================
# VOTER NAME
# ============================================================

def extract_voter_name(text):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    # ========================================================
    # 1. NAME : PERSON NAME
    # ========================================================

    for line in lines:

        # Exact:
        #
        # Name : PRAVANJAN ROY
        # NAME: PRAVANJAN ROY
        # Name - PRAVANJAN ROY
        #
        # Do NOT match Father's Name etc.

        match = re.match(
            r"^\s*NAME\s*[:\-]\s*(.+?)\s*$",
            line,
            re.IGNORECASE
        )

        if match:

            candidate = match.group(1).strip()

            if is_valid_name(candidate):
                return clean_name(candidate)

    # ========================================================
    # 2. NAME ON ONE LINE, VALUE ON NEXT LINE
    # ========================================================

    for i, line in enumerate(lines):

        if re.fullmatch(
            r"\s*NAME\s*[:\-]?\s*",
            line,
            re.IGNORECASE
        ):

            if i + 1 < len(lines):

                candidate = lines[i + 1]

                # Never accept relative fields
                if re.match(
                    r"^\s*(FATHER|MOTHER|HUSBAND|WIFE)",
                    candidate,
                    re.IGNORECASE
                ):
                    continue

                if is_valid_name(candidate):
                    return clean_name(candidate)

    # ========================================================
    # 3. OCR MERGED LABEL
    # ========================================================

    for line in lines:

        # Match:
        #
        # NAME:PRAVANJAN ROY
        # NAME PRAVANJAN ROY
        # NAME-PRAVANJAN ROY
        #

        match = re.search(
            r"\bNAME\s*[:\-]\s*(.+)",
            line,
            re.IGNORECASE
        )

        if not match:
            continue

        candidate = match.group(1)

        # Remove anything after a relative-name field
        candidate = re.split(
            r"\b(?:FATHER'?S?|MOTHER'?S?|HUSBAND'?S?|WIFE'?S?)\s+NAME\b",
            candidate,
            maxsplit=1,
            flags=re.IGNORECASE
        )[0]

        candidate = candidate.strip(
            " :-"
        )

        if is_valid_name(candidate):
            return clean_name(candidate)

    return None


# ============================================================
# GENERAL NAME EXTRACTION
# ============================================================

def extract_name(text, document_type):

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    # ========================================================
    # VOTER
    # ========================================================

    if document_type == "VOTER":

        return extract_voter_name(
            text
        )

    # ========================================================
    # PAN
    # ========================================================

    if document_type == "PAN":

        for i, line in enumerate(lines):

            upper = line.upper()

            if "NAME OF ASSESSEE" in upper:

                value = re.sub(
                    r"NAME OF ASSESSEE",
                    "",
                    line,
                    flags=re.IGNORECASE
                ).strip(" :-")

                if is_valid_name(value):
                    return clean_name(value)

                if i + 1 < len(lines):

                    candidate = lines[i + 1]

                    if is_valid_name(candidate):
                        return clean_name(candidate)

            if upper == "NAME":

                if i + 1 < len(lines):

                    candidate = lines[i + 1]

                    if is_valid_name(candidate):
                        return clean_name(candidate)

        # PAN fallback
        pan = extract_pan(text)

        if pan:

            for i, line in enumerate(lines):

                if pan in line.upper():

                    for j in range(
                        max(0, i - 4),
                        i
                    ):

                        candidate = lines[j]

                        if is_valid_name(candidate):
                            return clean_name(candidate)

    # ========================================================
    # AADHAAR
    # ========================================================

    if document_type == "AADHAAR":

        for i, line in enumerate(lines):

            upper = line.upper()

            if upper == "NAME":

                if i + 1 < len(lines):

                    candidate = lines[i + 1]

                    if is_valid_name(candidate):
                        return clean_name(candidate)

            if "NAME:" in upper:

                value = re.sub(
                    r"NAME\s*:",
                    "",
                    line,
                    flags=re.IGNORECASE
                ).strip()

                if is_valid_name(value):
                    return clean_name(value)

        # Aadhaar fallback
        for i, line in enumerate(lines):

            if not is_valid_name(line):
                continue

            if i + 1 < len(lines):

                next_line = lines[i + 1].upper()

                if (
                    "DOB" in next_line
                    or "DATE OF BIRTH" in next_line
                    or "YEAR OF BIRTH" in next_line
                    or re.search(
                        r"\b(19|20)[0-9]{2}\b",
                        next_line
                    )
                ):
                    return clean_name(line)

    # ========================================================
    # PASSPORT
    # ========================================================

    if document_type == "PASSPORT":

        for i, line in enumerate(lines):

            upper = line.upper()

            if (
                "GIVEN NAME" in upper
                or "GIVEN NAMES" in upper
            ):

                value = re.sub(
                    r"GIVEN NAMES?",
                    "",
                    line,
                    flags=re.IGNORECASE
                ).strip(" :-")

                if is_valid_name(value):
                    return clean_name(value)

                if i + 1 < len(lines):

                    candidate = lines[i + 1]

                    if is_valid_name(candidate):
                        return clean_name(candidate)

            if "SURNAME" in upper:

                value = re.sub(
                    r"SURNAME",
                    "",
                    line,
                    flags=re.IGNORECASE
                ).strip(" :-")

                if is_valid_name(value):
                    return clean_name(value)

                if i + 1 < len(lines):

                    candidate = lines[i + 1]

                    if is_valid_name(candidate):
                        return clean_name(candidate)

    return None


# ============================================================
# COMPLETE EXTRACTION
# ============================================================

def extract_document(image_path):

    raw_text = run_ocr(
        image_path
    )

    document_type = detect_document(
        raw_text
    )

    # Document-specific ID
    if document_type == "PAN":

        document_id = extract_pan(
            raw_text
        )

    elif document_type == "AADHAAR":

        document_id = extract_aadhaar(
            raw_text
        )

    elif document_type == "VOTER":

        document_id = extract_voter(
            raw_text
        )

    elif document_type == "PASSPORT":

        document_id = extract_passport(
            raw_text
        )

    else:

        document_id = None

    name = extract_name(
        raw_text,
        document_type
    )

    dob = extract_dob(
        raw_text,
        document_type
    )
    identity_hash_input = json.dumps(
        [name, dob, document_id],
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    identity_hash = hashlib.sha256(identity_hash_input).hexdigest()

    return {
        "document_type": document_type,
        "name": name,
        "dob": dob,
        "document_id": document_id,
        "identity_hash": identity_hash,
    }


@ocr_blueprint.route("", methods=["POST"])
def extract_image_data():
    uploaded_image = request.files.get("image")
    if uploaded_image is None:
        return jsonify({
            "status": "ERROR",
            "message": "Missing image file; upload it using the 'image' field",
        }), 400

    image_bytes = uploaded_image.read(MAX_IMAGE_BYTES + 1)
    if not image_bytes:
        return jsonify({
            "status": "ERROR",
            "message": "Uploaded image is empty",
        }), 400
    if len(image_bytes) > MAX_IMAGE_BYTES:
        return jsonify({
            "status": "ERROR",
            "message": "Image exceeds the 8 MiB upload limit",
        }), 413

    encoded_image = np.frombuffer(image_bytes, dtype=np.uint8)
    try:
        image = cv2.imdecode(encoded_image, cv2.IMREAD_COLOR)
    except cv2.error:
        image = None
    if image is None:
        return jsonify({
            "status": "ERROR",
            "message": "Uploaded file is not a valid image",
        }), 400

    result = extract_document(image)
    return jsonify({"status": "SUCCESS", "data": result}), 200