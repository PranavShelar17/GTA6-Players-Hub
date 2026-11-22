from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.users import router as users_router
from app.api.home import router as home_router
from app.api.news import router as news_router
from app.api.prices import router as prices_router
from app.api.events import router as events_router
from app.api.notifications import router as notifications_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(users_router)
api_router.include_router(home_router)
api_router.include_router(news_router)
api_router.include_router(prices_router)
api_router.include_router(events_router)
api_router.include_router(notifications_router)
