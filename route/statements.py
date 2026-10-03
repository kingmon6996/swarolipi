import json
import os
import random
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from flask import Blueprint, current_app, jsonify

load_dotenv()

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openai/gpt-oss-120b"
STATEMENT_COUNT = 5
STATEMENT_MAX_LENGTH = 240
API_TIMEOUT_SECONDS = 15
TOKEN_FILE = Path(__file__).resolve().parent.parent / "token.json"

statements_blueprint = Blueprint("statements", __name__)

FALLBACK_STATEMENTS_POOL = [
    "Seven stars illuminate the clear night sky.",
    "Green forests grow quickly after the spring rain.",
    "Every great journey begins with a single step.",
    "The morning sunlight crossed the quiet window.",
    "Knowledge becomes truly powerful when shared with others.",
    "Quiet rivers carve deep canyons over many years.",
    "Silver clouds float peacefully across the blue horizon.",
    "Bright morning rays guide our path forward today.",
    "Fresh sea breezes blow gently across the open beach.",
    "Clear water flows steadily down the mountain stream.",
]


def _extract_statements(response_body):
    """Extracts 5 normal statements from OpenRouter LLM response body cleanly."""
    content = ""
    try:
        choices = response_body.get("choices", [])
        if choices and isinstance(choices, list):
            content = choices[0].get("message", {}).get("content", "")
    except Exception:
        content = ""

    content = (content or "").strip()

    # Remove markdown code block wrappers if present (e.g. ```json ... ```)
    if content.startswith("```"):
        lines = content.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines).strip()

    extracted = []

    # Attempt JSON parsing
    try:
        payload = json.loads(content)
        raw_list = []
        if isinstance(payload, dict) and "statements" in payload:
            raw_list = payload["statements"]
        elif isinstance(payload, list):
            raw_list = payload

        if isinstance(raw_list, list):
            for s in raw_list:
                if isinstance(s, str) and s.strip():
                    extracted.append(s.strip())
    except Exception:
        pass

    # If JSON parsing yielded fewer than 5 statements, try line-based extraction
    if len(extracted) < STATEMENT_COUNT:
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        for line in lines:
            # Strip numbers like "1. ", "- ", quotes
            cleaned = line.lstrip("0123456789.-* \t\"'").rstrip("\"',")
            if cleaned and len(cleaned) <= STATEMENT_MAX_LENGTH and cleaned not in extracted:
                extracted.append(cleaned)

    # Sanitize and deduplicate
    final_statements = []
    for stmt in extracted:
        clean = stmt.strip()
        if clean and len(clean) <= STATEMENT_MAX_LENGTH and clean.casefold() not in {s.casefold() for s in final_statements}:
            final_statements.append(clean)

    # Limit to 5 statements
    final_statements = final_statements[:STATEMENT_COUNT]

    # Fill remaining from fallback pool if fewer than 5 returned
    if len(final_statements) < STATEMENT_COUNT:
        pool = [s for s in FALLBACK_STATEMENTS_POOL if s.casefold() not in {f.casefold() for f in final_statements}]
        random.shuffle(pool)
        needed = STATEMENT_COUNT - len(final_statements)
        final_statements.extend(pool[:needed])

    return final_statements


def _load_api_tokens():
    """Loads OpenRouter API tokens from token.json or OPENROUTER_API_KEY environment variable."""
    tokens = []
    try:
        if TOKEN_FILE.exists():
            token_data = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
            if isinstance(token_data, list):
                for item in token_data:
                    if isinstance(item, dict):
                        t = item.get("token") or item.get("api_key")
                        if isinstance(t, str) and t.strip():
                            tokens.append(t.strip())
    except Exception as e:
        print(f"[Statements] Warning loading token.json: {e}")

    environment_token = os.getenv("OPENROUTER_API_KEY", "").strip()
    if environment_token and environment_token not in tokens:
        tokens.append(environment_token)

    return tokens


def get_fallback_statements():
    """Returns 5 random normal statements from the pool."""
    pool = list(FALLBACK_STATEMENTS_POOL)
    random.shuffle(pool)
    return pool[:STATEMENT_COUNT]


@statements_blueprint.route("", methods=["POST", "GET"])
def get_statements():
    """Endpoint to fetch 5 normal English voice statements.
    Tries OpenRouter LLM generation first, with automatic extraction and fallback.
    """
    api_tokens = _load_api_tokens()

    if not api_tokens:
        # Fallback cleanly if no OpenRouter API key configured
        statements = get_fallback_statements()
        return jsonify({"status": "SUCCESS", "statements": statements, "fallback": True}), 200

    request_body = {
        "model": OPENROUTER_MODEL,
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "Create exactly five distinct, normal, everyday English sentences "
                    "for an adult to read aloud during voice verification. Each must "
                    "be a clear, simple, natural sentence (under 15 words), easy to pronounce, "
                    "neutral, and suitable for voice recording. Do NOT create difficult tongue twisters or complex jargon. "
                    "Return ONLY a JSON object with one key \"statements\" whose value is an array of "
                    "exactly five plain strings."
                ),
            },
            {
                "role": "user",
                "content": "Generate five simple, normal everyday sentences.",
            },
        ],
    }

    for token_index, api_key in enumerate(api_tokens, start=1):
        req = Request(
            OPENROUTER_API_URL,
            data=json.dumps(request_body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlopen(req, timeout=API_TIMEOUT_SECONDS) as response:
                response_body = json.loads(response.read().decode("utf-8"))
            statements = _extract_statements(response_body)

            if len(statements) == STATEMENT_COUNT:
                return jsonify({"status": "SUCCESS", "statements": statements}), 200

        except (HTTPError, URLError, TimeoutError, Exception) as error:
            current_app.logger.warning("OpenRouter token %s failed: %s", token_index, error)
            continue

    # If all tokens fail or rate limited, return clean normal fallback statements
    statements = get_fallback_statements()
    return jsonify({"status": "SUCCESS", "statements": statements, "fallback": True}), 200
