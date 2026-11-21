from datetime import datetime, timezone
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str


class ErrorObject(BaseModel):
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None


class ResponseMeta(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version: str = "1.0.0"
    request_id: Optional[str] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorObject] = None
    meta: ResponseMeta = Field(default_factory=ResponseMeta)
