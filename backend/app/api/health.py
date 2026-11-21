from datetime import datetime, timezone
from fastapi import APIRouter, status
from app.core.config import settings
from app.schemas.envelope import ApiResponse
from app.schemas.health import HealthData, ReadinessData

router = APIRouter(prefix="/health", tags=["System Health"])


@router.get(
    "",
    response_model=ApiResponse[HealthData],
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description="Liveness probe indicating that the FastAPI service is active and responsive."
)
async def get_health() -> ApiResponse[HealthData]:
    data = HealthData(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    return ApiResponse(
        success=True,
        data=data,
        error=None
    )


@router.get(
    "/ready",
    response_model=ApiResponse[ReadinessData],
    status_code=status.HTTP_200_OK,
    summary="Service Readiness Check",
    description="Readiness probe checking foundational subsystem readiness without faking external connections."
)
async def get_readiness() -> ApiResponse[ReadinessData]:
    # In Phase 1 foundation, we verify application settings readiness
    dependencies = {
        "configuration": "loaded",
        "api_router": "operational",
        "database": "configured_pending_phase_2"
    }

    data = ReadinessData(
        status="ready",
        ready=True,
        dependencies=dependencies,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    return ApiResponse(
        success=True,
        data=data,
        error=None
    )
