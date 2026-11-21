# GTA 6 Player Hub – Security & Threat Model Specification

## 1. Authentication & Identity Protection

### 1.1 Supabase Auth & JWT Architecture
- Identity authentication is managed through Supabase GoTrue, ensuring modern industry standards (Argon2 / bcrypt password hashing, automated brute force prevention, cryptographically signed tokens).
- Fast, stateless authorization is handled via JWT Bearer tokens:
  - Header: `Authorization: Bearer <token>`
  - Algorithms: `HS256` verified against `SUPABASE_JWT_SECRET`
  - Validations: `exp` (expiration), `sub` (user_id UUID), `role` (`authenticated`).
  - Tokens are never logged or stored in plain-text.

### 1.2 Anti-Enumeration Protections
- **Login Endpoint**: Authentication failures return a generic message: `"Invalid email or password."` Overly descriptive errors (such as "user does not exist") are strictly forbidden to prevent attacker username enumeration.
- **Password Recovery**: Submitting `/forgot-password` always returns a generic confirmation: `"If an account is associated with this email, password reset instructions have been sent."` regardless of whether the email address is registered.

### 1.3 Case-Insensitive Username Collision Prevention
- Usernames are restricted to regex `^[a-zA-Z0-9_]{3,30}$`.
- Database uniqueness is enforced using PostgreSQL's `LOWER()` index:
  ```sql
  CREATE UNIQUE INDEX idx_player_profiles_lower_username ON player_profiles (lower(username));
  ```
- This prevents impersonation attacks (e.g. `ViceCityLegend` vs `vicecitylegend`).

---

## 2. Row Level Security (RLS) Enforcement

Database security is enforced at the PostgreSQL engine level via Supabase Row Level Security:

1. **`player_profiles`**:
   - `SELECT`: Public profiles are visible to all; private profiles are visible only to `auth.uid() = user_id`.
   - `INSERT / UPDATE / DELETE`: Strictly constrained to `auth.uid() = user_id`.
2. **`player_preferences`**:
   - `SELECT / INSERT / UPDATE / DELETE`: Accessible exclusively by `auth.uid() = user_id`.
3. **`player_activities`**:
   - `SELECT / INSERT`: Accessible exclusively by `auth.uid() = user_id`.
4. **Storage (`avatars` bucket)**:
   - Uploads are path-restricted to `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text`.
   - Users can never overwrite or delete another user's avatar.

---

## 3. Media Upload Safeguards

Avatar uploads on `POST /api/v1/users/me/avatar` enforce strict multi-tier verification:
- **MIME Type Whitelist**: Only `image/jpeg`, `image/png`, `image/webp`, and `image/gif` are accepted. Executables, scripts, HTML, or SVG files with embedded script tags are rejected with HTTP 400.
- **File Size Limit**: Strictly bounded at **2 MB** (2,097,152 bytes). Oversized payloads are rejected before processing.
- **Sanitized Output**: Files are encoded safely or stored in dedicated user-isolated storage buckets.

---

## 4. Secret Management & Zero-Leakage Policy

- **`SUPABASE_SERVICE_ROLE_KEY`**: Strictly reserved for server-side administrative tasks. It is **NEVER** imported in frontend client code or exposed in `NEXT_PUBLIC_*` variables.
- **Startup Audit**: The backend validates required environment variables at boot and hides secret values in logs.
