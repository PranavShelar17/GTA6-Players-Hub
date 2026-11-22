# GTA 6 Player Hub – Community Media Upload Architecture (Phase 7)

## 1. Specifications & Restrictions

The media upload pipeline handles user-uploaded game screenshots, trailer frame breakdowns, and setup photos.

| Metric | Restriction |
|---|---|
| Max Images Per Post | 4 images |
| Max File Size | 10 MB (10,485,760 bytes) |
| Allowed MIME Types | `image/jpeg`, `image/png`, `image/webp` |
| Storage Target | `backend/uploads/community/` |
| Public Static Route | `/uploads/community/{filename}` |

---

## 2. Upload Lifecycle & Security

1. **Client-Side Validation**:
   - `CreatePostComposer.tsx` validates file size (<=10MB) and MIME type before sending multipart payload.
   - Restricts total file count to 4 attachments.
2. **Server-Side Validation**:
   - `media_service.save_community_media(file: UploadFile)` inspects `file.content_type` against `ALLOWED_MIME_TYPES`.
   - Reads content bytes and validates byte size `<= 10 * 1024 * 1024`.
   - Generates a cryptographically random UUIDv4 filename (e.g., `8d2f190e38a24bf48e916a086a9f4c3a.webp`) to prevent directory traversal or filename collision exploits.
3. **Static File Serving**:
   - FastAPI mounts the uploads directory via Starlette `StaticFiles` in `app/main.py`:
     ```python
     app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
     ```
   - Returned media URLs (`/uploads/community/{uuid}.ext`) are directly embeddable across web and mobile clients.
