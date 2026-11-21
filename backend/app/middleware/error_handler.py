import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.schemas.envelope import ApiResponse, ErrorDetail, ErrorObject

logger = logging.getLogger("gta6playerhub.error_handler")


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"HTTP {exc.status_code} error on {request.url.path}: {exc.detail}")
        error_resp = ApiResponse[None](
            success=False,
            data=None,
            error=ErrorObject(
                code=f"HTTP_{exc.status_code}",
                message=str(exc.detail),
                details=None
            )
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_resp.model_dump()
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.info(f"Validation error on {request.url.path}: {exc.errors()}")
        details = [
            ErrorDetail(
                field=" -> ".join(str(loc) for loc in err.get("loc", [])),
                issue=err.get("msg", "Invalid value")
            )
            for err in exc.errors()
        ]
        error_resp = ApiResponse[None](
            success=False,
            data=None,
            error=ErrorObject(
                code="VALIDATION_ERROR",
                message="Input validation failed.",
                details=details
            )
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_resp.model_dump()
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
        error_resp = ApiResponse[None](
            success=False,
            data=None,
            error=ErrorObject(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected server error occurred.",
                details=None
            )
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_resp.model_dump()
        )
