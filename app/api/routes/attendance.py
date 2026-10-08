"""出勤查询接口。"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.schemas import AttendanceQuery
from app.services import attendance_service, notify_service

router = APIRouter(tags=["出勤"])


@router.post("/attendance")
async def query_attendance(body: AttendanceQuery):
    """获取指定年月出勤数据。"""
    try:
        month_data = await attendance_service.get_month_attendance(
            body.email, body.year, body.month
        )
        return JSONResponse(
            {
                "msg": "获取出勤数据成功",
                "data": month_data.model_dump(by_alias=True),
            }
        )
    except PermissionError:
        return JSONResponse({"msg": "请先登录", "data": None})
    except Exception as exc:
        print(f"获取出勤失败: {exc}")
        return JSONResponse({"msg": "获取出勤数据失败", "data": None})


@router.post("/check-today")
async def trigger_check_today():
    """手动触发今日打卡检查与推送。"""
    await notify_service.check_today_and_notify()
    return JSONResponse({"msg": "ok"})
