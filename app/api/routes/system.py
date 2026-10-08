"""静态页与系统路由。"""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

from app.config import STATIC_DIR

router = APIRouter(tags=["系统"])


@router.get("/", response_class=HTMLResponse, summary="首页")
async def index(_: Request):
    """返回前端面板。"""
    html_path = STATIC_DIR / "index.html"
    if html_path.exists():
        return FileResponse(html_path)
    return HTMLResponse(
        content="<html><body><h1>出勤统计系统</h1><p>请先构建前端 panel/dist</p></body></html>",
        status_code=404,
    )


@router.get("/vite.svg", include_in_schema=False)
async def vite_svg():
    svg_path = STATIC_DIR / "vite.svg"
    if svg_path.exists():
        return FileResponse(svg_path, media_type="image/svg+xml")
    return JSONResponse({"error": "not found"}, status_code=404)
