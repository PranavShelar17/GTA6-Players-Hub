from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.users import router as users_router
from app.api.home import router as home_router
from app.api.news import router as news_router
from app.api.prices import router as prices_router
from app.api.events import router as events_router
from app.api.notifications import router as notifications_router
from app.api.community import router as community_router
from app.api.pc_compatibility import router as pc_router
from app.api.problem_solver import router as ai_router
from app.api.automation import router as automation_router
from app.api.search import router as search_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(users_router)
api_router.include_router(home_router)
api_router.include_router(news_router)
api_router.include_router(prices_router)
api_router.include_router(events_router)
api_router.include_router(notifications_router)
api_router.include_router(community_router)
api_router.include_router(pc_router)
api_router.include_router(ai_router)
api_router.include_router(automation_router)
api_router.include_router(search_router)
