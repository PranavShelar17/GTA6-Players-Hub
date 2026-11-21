from typing import Dict
from pydantic import BaseModel


class HealthData(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    timestamp: str


class ReadinessData(BaseModel):
    status: str
    ready: bool
    dependencies: Dict[str, str]
    timestamp: str
