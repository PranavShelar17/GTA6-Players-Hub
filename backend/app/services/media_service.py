import os
import uuid
from typing import Tuple
from fastapi import HTTPException, UploadFile, status

# Allowed image MIME types and maximum file size (10 MB)
ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Target directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "community")


def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


async def save_community_media(file: UploadFile) -> Tuple[str, int, str]:
    """
    Validates and writes uploaded image to local uploads directory.
    Returns: (media_url, file_size, media_type)
    """
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed types: JPEG, PNG, WebP.",
        )

    ensure_upload_dir()

    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of 10MB ({file_size} bytes).",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    ext = ALLOWED_MIME_TYPES[content_type.lower()]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(destination_path, "wb") as f:
        f.write(content)

    media_url = f"/uploads/community/{unique_filename}"
    return media_url, file_size, "IMAGE"
