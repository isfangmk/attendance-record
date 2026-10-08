"""应用生命周期：定时任务与会话恢复。"""

from __future__ import annotations

from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from app.services import session_store
from app.services.notify_service import tick_user_reminders


@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    启动每分钟调度（按各用户自己的提醒时刻触发）；
    关闭时停止调度器。
    """
    scheduler = AsyncIOScheduler()
    scheduler.add_job(tick_user_reminders, "cron", minute="*")
    scheduler.start()
    print("打卡提醒调度已启动：每分钟检查各用户提醒配置")
    session_store.restore_sessions()
    yield
    scheduler.shutdown()
