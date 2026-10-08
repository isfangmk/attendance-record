"""FastAPI 应用工厂。"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import build_api_router
from app.api.routes import system as system_routes
from app.config import ROOT_PATH, STATIC_DIR
from app.lifespan import lifespan


def create_inner_app() -> FastAPI:
    """创建挂载在 ROOT_PATH 下的业务应用。"""
    app = FastAPI(title="出勤统计系统 API", version="2.0.0", lifespan=lifespan)

    if (STATIC_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(build_api_router())
    app.include_router(system_routes.router)
    return app


def create_app() -> FastAPI:
    """
    创建对外应用：根路径重定向到 ROOT_PATH。

    uvicorn main:app 与 python main.py 行为一致。
    """
    inner = create_inner_app()
    root = FastAPI(title="出勤统计系统", version="2.0.0")
    root.mount(ROOT_PATH, inner)

    @root.get("/", include_in_schema=False)
    async def redirect_root():
        return RedirectResponse(url=f"{ROOT_PATH}/", status_code=302)

    return root
