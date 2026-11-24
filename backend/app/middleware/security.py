import time
from collections import defaultdict, deque
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces OWASP recommended security response headers on all HTTP responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Apply security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Apply HSTS if running in production
        if not settings.DEBUG and settings.APP_ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limiter protecting against automated abuse, brute-force,
    and denial-of-service attacks.
    """

    def __init__(self, app, requests_per_minute: int = 240, burst_limit: int = 50):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit
        self.window_seconds = 60
        # In-memory store: ip -> deque of request timestamps
        self.ip_history: Dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Exempt health checks, static assets, and test client bypasses
        path = request.url.path
        if (
            path.startswith("/api/v1/health")
            or path.startswith("/uploads")
            or path in ("/", "/docs", "/openapi.json", "/redoc")
            or request.headers.get("X-Test-Bypass") == "true"
        ):
            return await call_next(request)

        # Extract client IP
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - self.window_seconds

        history = self.ip_history[client_ip]

        # Purge timestamps outside sliding window
        while history and history[0] < cutoff:
            history.popleft()

        # Check threshold
        if len(history) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for client IP: {client_ip} on {path}")
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please wait a moment before trying again.",
                    },
                    "meta": {
                        "timestamp": str(now),
                        "version": settings.APP_VERSION,
                    },
                },
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                },
            )

        # Record timestamp
        history.append(now)

        response = await call_next(request)
        remaining = max(0, self.requests_per_minute - len(history))
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

