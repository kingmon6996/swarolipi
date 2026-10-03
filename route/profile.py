from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlmodel import select, func

from database import get_session
from models import Profile

profile_blueprint = Blueprint("profile", __name__)


def _connect_existing_profile(
    session,
    profile,
    wallet_provider,
    chain,
    display_name,
    avatar_url,
):
    if wallet_provider:
        profile.wallet_provider = wallet_provider
    if chain:
        profile.chain = chain
    if display_name and not profile.display_name:
        profile.display_name = display_name
    if avatar_url and not profile.avatar_url:
        profile.avatar_url = avatar_url

    profile.updated_at = datetime.now(timezone.utc)
    session.add(profile)
    session.commit()
    session.refresh(profile)

    return jsonify({
        "message": "Account connected (existing user)",
        "profile": profile.to_dict(),
        "is_new": False,
    }), 200


@profile_blueprint.route("/connect", methods=["POST"])
def connect_account():
    """Endpoint called when someone connects to a new or existing account in the frontend.
    Creates a row in the 'profile' table if one does not exist for the wallet address,
    or updates existing profile details.
    """
    data = request.get_json(silent=True) or {}
    raw_address = data.get("wallet_address") or data.get("walletAddress")

    if not raw_address or not isinstance(raw_address, str) or not raw_address.strip():
        return jsonify({"error": "wallet_address is required"}), 400

    wallet_address = raw_address.strip()
    wallet_address_lower = wallet_address.lower()
    wallet_provider = data.get("wallet_provider") or data.get("walletProvider")
    chain = data.get("chain")
    display_name = data.get("display_name") or data.get("name")
    avatar_url = data.get("avatar_url") or data.get("avatarUrl")
    bio = data.get("bio")

    with get_session() as session:
        # Search for existing profile by wallet_address (case-insensitive)
        statement = select(Profile).where(func.lower(Profile.wallet_address) == wallet_address_lower)
        existing_profile = session.exec(statement).first()

        if existing_profile:
            return _connect_existing_profile(
                session,
                existing_profile,
                wallet_provider,
                chain,
                display_name,
                avatar_url,
            )

        # Create new profile row for user
        default_name = display_name or f"User {wallet_address[:6]}...{wallet_address[-4:]}"
        now = datetime.now(timezone.utc)
        new_profile = Profile(
            wallet_address=wallet_address,
            wallet_provider=wallet_provider,
            chain=chain,
            display_name=default_name,
            avatar_url=avatar_url,
            bio=bio,
            wallet_verified=True,
            human_verified=False,
            human_verified_at=None,
            identity_verified=False,
            identity_country=None,
            identity_document_type=None,
            identity_verified_at=None,
            created_at=now,
            updated_at=now,
        )

        session.add(new_profile)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            existing_profile = session.exec(statement).first()
            if existing_profile is None:
                raise
            return _connect_existing_profile(
                session,
                existing_profile,
                wallet_provider,
                chain,
                display_name,
                avatar_url,
            )
        session.refresh(new_profile)

        return jsonify({
            "message": "New user profile created successfully",
            "profile": new_profile.to_dict(),
            "is_new": True,
        }), 201


@profile_blueprint.route("/<wallet_address>", methods=["GET"])
def get_profile(wallet_address):
    """Retrieve profile by wallet address."""
    if not wallet_address:
        return jsonify({"error": "wallet_address is required"}), 400

    wallet_address_lower = wallet_address.strip().lower()

    with get_session() as session:
        statement = select(Profile).where(func.lower(Profile.wallet_address) == wallet_address_lower)
        profile = session.exec(statement).first()

        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        return jsonify({"profile": profile.to_dict()}), 200


@profile_blueprint.route("/<wallet_address>", methods=["PUT", "PATCH"])
def update_profile(wallet_address):
    """Update profile attributes for a given wallet address."""
    if not wallet_address:
        return jsonify({"error": "wallet_address is required"}), 400

    data = request.get_json(silent=True) or {}
    wallet_address_lower = wallet_address.strip().lower()

    with get_session() as session:
        statement = select(Profile).where(func.lower(Profile.wallet_address) == wallet_address_lower)
        profile = session.exec(statement).first()

        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        if "display_name" in data or "name" in data:
            profile.display_name = data.get("display_name") or data.get("name")
        if "avatar_url" in data or "avatarUrl" in data:
            profile.avatar_url = data.get("avatar_url") or data.get("avatarUrl")
        if "bio" in data:
            profile.bio = data.get("bio")
        if "human_verified" in data or "humanVerified" in data:
            profile.human_verified = bool(data.get("human_verified") if "human_verified" in data else data.get("humanVerified"))
            if profile.human_verified and not profile.human_verified_at:
                profile.human_verified_at = datetime.now(timezone.utc).isoformat()
        if "identity_verified" in data or "identityVerified" in data:
            profile.identity_verified = bool(data.get("identity_verified") if "identity_verified" in data else data.get("identityVerified"))
            if profile.identity_verified and not profile.identity_verified_at:
                profile.identity_verified_at = datetime.now(timezone.utc).isoformat()
        if "identity_country" in data or "identityCountry" in data:
            profile.identity_country = data.get("identity_country") or data.get("identityCountry")
        if "identity_document_type" in data or "identityDocumentType" in data:
            profile.identity_document_type = data.get("identity_document_type") or data.get("identityDocumentType")
        if "identity_document_hash" in data or "identityDocumentHash" in data:
            profile.identity_document_hash = data.get("identity_document_hash") or data.get("identityDocumentHash")

        profile.updated_at = datetime.now(timezone.utc)
        session.add(profile)
        session.commit()
        session.refresh(profile)

        return jsonify({"message": "Profile updated successfully", "profile": profile.to_dict()}), 200
