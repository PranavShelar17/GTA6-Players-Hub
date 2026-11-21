# GTA 6 Player Hub – Security & Compliance Architecture

## 1. Threat Modeling & Attack Surface Analysis

As a gaming platform handling user accounts, community discussions, and automated data ingestion, GTA 6 Player Hub must defend against several core threats:

| Threat Category | Potential Attack Vector | Applied Mitigation |
| :--- | :--- | :--- |
| **Authentication Hijacking** | Credential stuffing, brute force, token theft | Argon2id password hashing via Supabase Auth, JWT rotation, secure HTTP-only cookies, Redis token bucket rate limiting on `/auth/*`. |
| **Cross-Site Scripting (XSS)** | Malicious scripts injected into community posts, bios, or comments | React automatic DOM escaping, DOMPurify HTML sanitization for rich text, strict Content Security Policy (CSP) headers. |
| **SQL / ORM Injection** | Malicious inputs in search or query parameters | 100% parameterized queries via SQLAlchemy 2.0 ORM and Pydantic v2 type coercion. |
| **Server-Side Request Forgery (SSRF)** | Malicious external image URLs or webhook callbacks | Strict URL parsing, image proxying, and validation against a strict protocol and host whitelist. |
| **Prompt Injection / AI Jailbreaking** | User crafting adversarial inputs to force AI into illegal advice | Strict system instructions, input sanitization, separate vector context isolation, and post-generation response safety validation. |
| **Denial of Service (DoS)** | Excessive API traffic, slowloris attacks | Nginx / Cloudflare edge rate limiting, FastAPI slowapi middleware, Redis-backed rate limiting. |
| **Unsafe System Advice** | AI recommending risky BIOS tweaks or registry deletions | Explicit system guardrails instructing the AI to refuse destructive advice and explain hardware uncertainty. |

---

## 2. Authentication & Authorization Architecture

### 2.1 Token Lifecycle & Storage
- **Access Tokens**: Short-lived JSON Web Tokens (15-minute expiration) containing user identity, verified email status, and role.
- **Refresh Tokens**: Long-lived tokens (7-day sliding window) stored securely in `HttpOnly`, `SameSite=Lax`, `Secure` cookies, preventing client-side JavaScript access.
- **Token Invalidation**: Server-side Redis blacklist tracking revoked tokens during password resets or suspicious activity.

### 2.2 Role-Based Access Control (RBAC) & Object Permissions
- **Public**: Can read verified news, check deals, use PC compatibility calculator, read community discussions, and access public error guides.
- **Verified Player**: Can create community posts, submit comments, vote in polls, save wishlist items, bookmark news, and save PC compatibility reports.
- **Moderator (Internal CLI / DB Role)**: Can review flagged community content and mute abusive accounts. No public admin web interface exists.

---

## 3. Data Protection & Privacy Safeguards

### 3.1 Data Minimization
- We collect only essential user data: Email, chosen username, display name, and optional platform/country preference.
- No real names, physical addresses, or financial payment details are ever processed or stored on our servers.
- Deals Tracker redirects users directly to authorized retail websites; all transactions occur on external retailer domains.

### 3.2 Content Moderation & Abuse Prevention
- **Automated Word Filter**: Pre-submission regex and dictionary scanning for hate speech, harassment, doxxing, and malicious links.
- **Reporting Workflow**: Any registered player can flag offensive posts or comments. Flagged items are automatically suppressed when reports exceed threshold.
- **User Muting & Blocking**: Two-way blocking prevents blocked users from seeing each other's posts or sending replies.

---

## 4. AI Safety & Guardrails Engine

The Gaming Problem Solver (`/support`) incorporates strict safety guardrails:

1. **System Guardrails**:
   ```text
   You are the GTA 6 Player Hub Technical Problem Solver.
   You provide verified, safe troubleshooting advice for gaming issues.
   RULES:
   1. NEVER suggest modifying BIOS settings, flashing firmware, or modifying Windows registry keys that can prevent system boot.
   2. NEVER recommend downloading executables from unverified third-party sites.
   3. Always state clearly that GTA 6 PC requirements are not officially confirmed.
   4. If an error is ambiguous, state your uncertainty and suggest safe steps first (e.g. clean driver install, verifying game files).
   ```
2. **Output Sanitation**: Generated responses are scanned for blacklisted system commands (`reg delete`, `format`, `del /s`) before being returned to the user.

---

## 5. Security Headers & Network Policies

The following HTTP response headers are enforced globally across all Next.js and FastAPI routes:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
