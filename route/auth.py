import hashlib
import json
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, jsonify, request
from sqlmodel import Session, select

from database import get_engine, get_session
from models import AuthToken, Profile

auth_blueprint = Blueprint("auth", __name__)

# Load token pool from backend/token.json if present
TOKEN_JSON_PATH = Path(__file__).resolve().parent.parent / "token.json"
TOKEN_POOL = []

if TOKEN_JSON_PATH.exists():
    try:
        with open(TOKEN_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                TOKEN_POOL = [item["token"].strip() for item in data if isinstance(item, dict) and "token" in item]
    except Exception as e:
        print(f"[Auth] Notice loading token.json pool: {e}")


def generate_dapp_token() -> str:
    """Selects a token from token.json pool or generates a new cryptographic token."""
    if TOKEN_POOL:
        # Pick one unused token or dynamic secret
        token_candidate = secrets.choice(TOKEN_POOL)
        with get_session() as session:
            existing = session.exec(select(AuthToken).where(AuthToken.token == token_candidate)).first()
            if not existing:
                return token_candidate

    # Fallback generation
    return f"sk-or-v1-{secrets.token_hex(32)}"


def compute_token_hash(token_str: str) -> str:
    """Computes SHA-256 hash string for on-chain & DB verification."""
    return "0x" + hashlib.sha256(token_str.encode("utf-8")).hexdigest()


@auth_blueprint.route("/authorize", methods=["POST"])
def authorize_dapp():
    """
    Registers a new token and authorized scope permissions for a third-party dApp.
    Registers token hash in PostgreSQL DB and on-chain registry format.
    """
    data = request.get_json(silent=True) or {}
    wallet_address = data.get("wallet_address", "").strip().lower()
    dapp_name = data.get("dapp_name", "Third Party dApp").strip()
    dapp_domain = data.get("dapp_domain", "dapp.example.eth").strip()
    scopes_list = data.get("scopes", ["is_human", "identity", "name", "profile_pic", "wallet_address"])

    if not wallet_address:
        return jsonify({"success": False, "error": "wallet_address is required"}), 400

    if isinstance(scopes_list, list):
        scopes_str = ",".join([s.strip().lower() for s in scopes_list if s.strip()])
    else:
        scopes_str = str(scopes_list)

    token_str = generate_dapp_token()
    token_hash_hex = compute_token_hash(token_str)

    with get_session() as session:
        # Find or ensure profile exists
        profile = session.exec(select(Profile).where(Profile.wallet_address == wallet_address)).first()
        if not profile:
            profile = Profile(
                wallet_address=wallet_address,
                wallet_verified=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(profile)
            session.commit()
            session.refresh(profile)

        # Check if active token already exists for this dapp + wallet
        existing_token = session.exec(
            select(AuthToken).where(
                AuthToken.wallet_address == wallet_address,
                AuthToken.dapp_name == dapp_name,
                AuthToken.is_revoked == False
            )
        ).first()

        if existing_token:
            # Update scopes & token
            existing_token.token = token_str
            existing_token.token_hash = token_hash_hex
            existing_token.scopes = scopes_str
            existing_token.created_at = datetime.now(timezone.utc)
            session.add(existing_token)
            session.commit()
            session.refresh(existing_token)
            auth_record = existing_token
        else:
            auth_record = AuthToken(
                token=token_str,
                token_hash=token_hash_hex,
                wallet_address=wallet_address,
                dapp_name=dapp_name,
                dapp_domain=dapp_domain,
                scopes=scopes_str,
                is_revoked=False,
                created_at=datetime.now(timezone.utc),
            )
            session.add(auth_record)
            session.commit()
            session.refresh(auth_record)

        return jsonify({
            "success": True,
            "message": "Authorization token generated and registered successfully",
            "token": auth_record.token,
            "token_hash": auth_record.token_hash,
            "wallet_address": auth_record.wallet_address,
            "dapp_name": auth_record.dapp_name,
            "dapp_domain": auth_record.dapp_domain,
            "scopes": auth_record.to_dict()["scopes"],
            "created_at": auth_record.created_at.isoformat() if auth_record.created_at else None,
        }), 200


@auth_blueprint.route("/access", methods=["POST"])
def access_scopes():
    """
    Third-party dApp endpoint to access authorized user data using the token token.
    Enforces scope checking and fails immediately if token is revoked!
    """
    # Get token from Bearer header or body
    auth_header = request.headers.get("Authorization", "")
    data = request.get_json(silent=True) or {}
    
    token_str = ""
    if auth_header.startswith("Bearer "):
        token_str = auth_header.replace("Bearer ", "").strip()
    elif "token" in data:
        token_str = data.get("token", "").strip()

    if not token_str:
        return jsonify({"success": False, "error": "Token is required in Authorization header or body"}), 401

    with get_session() as session:
        auth_record = session.exec(select(AuthToken).where(AuthToken.token == token_str)).first()

        if not auth_record:
            return jsonify({"success": False, "error": "Invalid token or authorization token not found"}), 404

        # Check Revocation Status
        if auth_record.is_revoked:
            return jsonify({
                "success": False,
                "error": "Authorization token has been REVOKED by user",
                "is_revoked": True,
                "revoked_at": auth_record.revoked_at.isoformat() if auth_record.revoked_at else None
            }), 403

        # Retrieve user profile
        profile = session.exec(select(Profile).where(Profile.wallet_address == auth_record.wallet_address)).first()
        if not profile:
            return jsonify({"success": False, "error": "User profile associated with token not found"}), 444

        granted_scopes = auth_record.to_dict()["scopes"]
        scoped_data = {}

        # 1. Scope: wallet_address
        if "wallet" in granted_scopes or "wallet_address" in granted_scopes:
            scoped_data["wallet_address"] = profile.wallet_address

        # 2. Scope: is_human / human
        if "human" in granted_scopes or "is_human" in granted_scopes:
            scoped_data["is_human"] = profile.human_verified
            scoped_data["human_verified_at"] = profile.human_verified_at

        # 3. Scope: identity
        if "identity" in granted_scopes:
            scoped_data["identity_verified"] = profile.identity_verified
            scoped_data["identity_country"] = profile.identity_country
            scoped_data["identity_document_type"] = profile.identity_document_type
            scoped_data["identity_document_hash"] = profile.identity_document_hash
            scoped_data["identity_verified_at"] = profile.identity_verified_at

        # 4. Scope: name / display_name
        if "name" in granted_scopes or "display_name" in granted_scopes:
            scoped_data["display_name"] = profile.display_name or "Anonymous User"

        # 5. Scope: profile_pic / image / avatar
        if "image" in granted_scopes or "profile_pic" in granted_scopes or "avatar" in granted_scopes:
            scoped_data["avatar_url"] = profile.avatar_url or ""

        return jsonify({
            "success": True,
            "dapp_name": auth_record.dapp_name,
            "wallet_address": profile.wallet_address,
            "granted_scopes": granted_scopes,
            "is_revoked": False,
            "data": scoped_data
        }), 200


from sqlalchemy import func

@auth_blueprint.route("/tokens/<wallet_address>", methods=["GET"])
def get_user_tokens(wallet_address: str):
    """Retrieves all active & revoked dApp authorization tokens for a user wallet."""
    clean_wallet = wallet_address.strip().lower()
    with get_session() as session:
        tokens = session.exec(
            select(AuthToken).where(func.lower(AuthToken.wallet_address) == clean_wallet)
        ).all()
        return jsonify({
            "success": True,
            "wallet_address": clean_wallet,
            "tokens": [t.to_dict() for t in tokens]
        }), 200


@auth_blueprint.route("/revoke", methods=["POST"])
def revoke_token():
    """
    Revokes authorization token for a dApp.
    Once revoked, third-party dApps attempting to fetch scope data using this token will fail immediately.
    """
    data = request.get_json(silent=True) or {}
    wallet_address = data.get("wallet_address", "").strip().lower()
    token_str = data.get("token", "").strip()
    dapp_name = data.get("dapp_name", "").strip().lower()
    app_id = data.get("applicationId", "").strip().lower()

    if not wallet_address:
        return jsonify({"success": False, "error": "wallet_address is required"}), 400

    with get_session() as session:
        all_wallet_tokens = session.exec(
            select(AuthToken).where(func.lower(AuthToken.wallet_address) == wallet_address)
        ).all()

        if not all_wallet_tokens:
            return jsonify({"success": False, "error": "No tokens found for wallet"}), 404

        target_tokens = []
        if token_str:
            target_tokens = [t for t in all_wallet_tokens if t.token == token_str]
        elif dapp_name or app_id:
            target_name = dapp_name or app_id
            target_tokens = [
                t for t in all_wallet_tokens 
                if target_name in t.dapp_name.lower() or t.dapp_name.lower() in target_name
            ]
        else:
            # Revoke all active tokens for this wallet if no specific filter
            target_tokens = [t for t in all_wallet_tokens if not t.is_revoked]

        if not target_tokens:
            # Fallback: revoke all tokens for wallet
            target_tokens = all_wallet_tokens

        revoked_count = 0
        now = datetime.now(timezone.utc)
        for t in target_tokens:
            t.is_revoked = True
            t.revoked_at = now
            session.add(t)
            revoked_count += 1

        session.commit()

        return jsonify({
            "success": True,
            "message": f"Successfully revoked {revoked_count} token(s).",
            "wallet_address": wallet_address,
            "is_revoked": True,
            "revoked_at": now.isoformat()
        }), 200


@auth_blueprint.route("/verify-token/<token_str>", methods=["GET"])
def verify_token(token_str: str):
    """Public lookup API to check if an authorization token is valid and unrevoked."""
    clean_token = token_str.strip()
    with get_session() as session:
        auth_record = session.exec(select(AuthToken).where(AuthToken.token == clean_token)).first()

        if not auth_record:
            return jsonify({
                "valid": False,
                "error": "Token not found"
            }), 404

        if auth_record.is_revoked:
            return jsonify({
                "valid": False,
                "is_revoked": True,
                "error": "Token has been revoked by user",
                "revoked_at": auth_record.revoked_at.isoformat() if auth_record.revoked_at else None
            }), 200

        return jsonify({
            "valid": True,
            "is_revoked": False,
            "dapp_name": auth_record.dapp_name,
            "dapp_domain": auth_record.dapp_domain,
            "scopes": auth_record.to_dict()["scopes"],
            "wallet_address": auth_record.wallet_address,
            "token_hash": auth_record.token_hash,
            "created_at": auth_record.created_at.isoformat() if auth_record.created_at else None
        }), 200
