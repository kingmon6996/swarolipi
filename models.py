from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Profile(SQLModel, table=True):
    __tablename__ = "profile"

    id: Optional[int] = Field(default=None, primary_key=True)
    wallet_address: str = Field(index=True, unique=True, nullable=False)
    wallet_provider: Optional[str] = Field(default=None)
    chain: Optional[str] = Field(default=None)
    display_name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    wallet_verified: bool = Field(default=True)
    human_verified: bool = Field(default=False)
    human_verified_at: Optional[str] = Field(default=None)
    identity_verified: bool = Field(default=False)
    identity_country: Optional[str] = Field(default=None)
    identity_document_type: Optional[str] = Field(default=None)
    identity_document_hash: Optional[str] = Field(default=None)
    identity_verified_at: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "wallet_address": self.wallet_address,
            "wallet_provider": self.wallet_provider,
            "chain": self.chain,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "wallet_verified": self.wallet_verified,
            "human_verified": self.human_verified,
            "human_verified_at": self.human_verified_at,
            "identity_verified": self.identity_verified,
            "identity_country": self.identity_country,
            "identity_document_type": self.identity_document_type,
            "identity_document_hash": self.identity_document_hash,
            "identity_verified_at": self.identity_verified_at,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
