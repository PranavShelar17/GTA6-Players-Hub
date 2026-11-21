import uuid
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.core.config import settings
from app.core.logging import logger

security_bearer = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: uuid.UUID
    email: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    is_authenticated: bool = True
    role: str = "authenticated"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> CurrentUser:
    """
    Validates Supabase JWT access token or development bearer token.
    Extracts user_id, email, and metadata securely.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Development / Testing bypass for explicit mock token
    # Delimited by '::', e.g. test-token::<uuid>::<email>
    if token.startswith("test-token::"):
        parts = token.split("::")
        test_id = parts[1] if len(parts) > 1 else "00000000-0000-0000-0000-000000000001"
        test_email = parts[2] if len(parts) > 2 else "testplayer@example.com"
        return CurrentUser(
            id=uuid.UUID(test_id),
            email=test_email,
            username="TestPlayer",
            display_name="Test Player",
            role="authenticated"
        )

    try:
        # Decode and verify Supabase JWT
        # Supabase JWTs are signed with the project's JWT secret using HS256
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={
                "verify_aud": False,  # Supabase tokens carry aud: "authenticated"
                "verify_exp": True,
            }
        )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject (user_id).",
                headers={"WWW-Authenticate": "Bearer"},
            )

        email = payload.get("email", "")
        user_metadata = payload.get("user_metadata", {})
        username = user_metadata.get("username")
        display_name = user_metadata.get("display_name") or user_metadata.get("full_name")

        return CurrentUser(
            id=uuid.UUID(user_id_str),
            email=email,
            username=username,
            display_name=display_name,
            role=payload.get("role", "authenticated")
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT signature verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Optional[CurrentUser]:
    """
    Optional token validator. Returns CurrentUser if valid, otherwise None.
    Does not raise 401 for anonymous viewers.
    """
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
