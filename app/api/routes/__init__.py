"""路由注册。"""

from fastapi import APIRouter

from app.api.routes import attendance, auth, settings, system


def build_api_router() -> APIRouter:
    """组装 /api 下全部路由。"""
    router = APIRouter(prefix="/api")
    router.include_router(auth.router)
    router.include_router(attendance.router)
    router.include_router(settings.router)
    router.include_router(system.router)
    return router
