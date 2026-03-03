import asyncio
import calendar
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from httpx import AsyncClient

from app.common import user_infos, extract_jwt_hcm_uid, cookie_str_to_dict
from app.http_utils import AsyncHttpTool
from app.models import AttendanceSummary, AttendanceResponse, LoginRequest, LogoutRequest, AttendanceRequest, \
    CookieLoginRequest
from app.mokahr_api import get_shift_data, get_daily_attendance


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 启动时 ---

    yield  # 运行应用

    # --- 关闭时 ---
    # for user_info in user_infos.values():
    #     if user_info["asyncHttpTool"]:
            # await user_info["asyncHttpTool"].logout()


# 创建 FastAPI 应用
app = FastAPI(title="出勤统计系统 API", version="1.0.0", lifespan=lifespan)
base_dir = os.path.dirname(__file__)
static_dir = os.path.join(base_dir, "panel", "dist")
app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
# 配置静态文件服务
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境请指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/cookie-login")
async def cookie_login(request: CookieLoginRequest):
    """使用cookie进行登录"""
    user_info_url = "https://core.mokahr.com/api/aggregate/pc/employeeProfile/v1/getDetail?bus=20"
    employee_id = extract_jwt_hcm_uid(cookie_str_to_dict(request.cookie)["moka-jwt"])
    async with AsyncClient() as client:
        response = await client.post(url=user_info_url,
                                     headers={
                                         "Cookie": request.cookie,
                                         "Content-Type": "application/json"
                                     },
                                     json={
                                         "employeeId": employee_id,
                                         "loginType": "10"
                                     })
        response.raise_for_status()
        response_data = response.json()
        email = response_data["data"]["officeEmail"]
    if not email:
        return JSONResponse(content={
            "msg": "登录失败",
            "data": None
        })
    if email not in user_infos:
        user_infos[email] = {
            "asyncHttpTool": None,
            "employee_id": None
        }
    http_tool = user_infos[email]['asyncHttpTool']
    if not http_tool:
        http_tool = AsyncHttpTool()
        http_tool.set_auth_info(cookie=request.cookie)
        user_infos[email].update({
            "asyncHttpTool": http_tool,
            "employee_id": employee_id
        })
    return JSONResponse(content={
        "msg": "登录成功",
        "data": email
    })


@app.post("/api/login")
async def login(request: LoginRequest):
    """使用用户名密码进行登录（备选方案）"""
    if request.email not in user_infos:
        user_infos[request.email] = {
            "asyncHttpTool": None,
            "employee_id": None
        }
    http_tool = user_infos[request.email]['asyncHttpTool']
    if not http_tool:
        http_tool = AsyncHttpTool()
        client = await http_tool.login(request.email, request.password)
        if not client:
            return JSONResponse(content={
                "msg": "登录失败",
                "data": None
            })
        moka_jwt = client.cookies.get("moka-jwt")
        employee_id = extract_jwt_hcm_uid(moka_jwt)
        user_infos[request.email].update({"asyncHttpTool": http_tool})
        user_infos[request.email].update({"employee_id": employee_id})
    return JSONResponse(content={
        "msg": "登录成功",
        "data": request.email
    })


@app.post("/api/logout")
async def logout(request: LogoutRequest):
    http_tool = user_infos[request.email]['asyncHttpTool']
    if http_tool:
        await http_tool.logout()
        user_infos[request.email].update({"asyncHttpTool": None})
        return JSONResponse(content={
            "msg": "登出成功",
            "data": request.email
        })
    else:
        return JSONResponse(content={
            "msg": "请先登录",
            "data": None
        })


# 得到指定年月的出勤数据
async def get_attendance_data(client: AsyncClient, year: int, month: int,
                              employee_id: int) -> AttendanceResponse | None:
    shift_data = await get_shift_data(client, year, month)
    if not shift_data:
        return None
    tasks = [get_daily_attendance(client, year, month, day, employee_id, shift_data) for day in shift_data.keys()]
    days = await asyncio.gather(*tasks)
    total_attendance = 0
    total_work_hours = 0
    early_leave_count = 0
    overtime_days = 0
    total_leave_days = 0.0
    total_out_hours = 0.0
    for day in days:
        if day.status in ["present", "overtime", "early_leave"]:
            total_attendance += 1
            if day.status == "overtime":
                overtime_days += 1
            if day.status == "early_leave":
                early_leave_count += 1
        total_work_hours += day.workHours
        total_leave_days += day.leaveDays
        total_out_hours += day.outDays
    days_in_month = calendar.monthrange(year, month)[1]
    work_days = 0
    for day in shift_data.values():
        if 'workday' == day:
            work_days += 1
    summary = AttendanceSummary(totalAttendance=total_attendance,
                                avgHours=0 if total_attendance == 0 else round(total_work_hours / total_attendance, 1),
                                earlyLeaveCount=early_leave_count,
                                leaveDays=total_leave_days,
                                overtimeDays=overtime_days,
                                workDays=work_days,
                                outDays=total_out_hours
                                )

    return AttendanceResponse(
        year=year,
        month=month,
        daysInMonth=days_in_month,
        firstDayOfMonth=calendar.monthrange(year, month)[0],  # 0=星期一
        summary=summary,
        days=days
    )


@app.post("/api/attendance", response_model=AttendanceResponse, summary="获取指定月份的出勤数据")
async def get_attendance(request: AttendanceRequest):
    """
    获取指定年月的出勤数据
    """
    if request.email not in user_infos:
        return JSONResponse(content={
            "msg": "请先登录",
            "data": None
        })
    http_tool: AsyncHttpTool = user_infos[request.email]["asyncHttpTool"]
    if not http_tool:
        return JSONResponse(content={
            "msg": "请先登录",
            "data": None
        })
    attendance_data = await get_attendance_data(http_tool.client, request.year, request.month,
                                                employee_id=user_infos[request.email]["employee_id"])
    if not attendance_data:
        return JSONResponse(content={
            "msg": "获取出勤数据失败",
            "data": None
        })
    return JSONResponse(content={
        "msg": "获取出勤数据成功",
        "data": attendance_data.model_dump()
    })


@app.get("/", response_class=HTMLResponse, summary="首页")
async def root(request: Request):
    """访问根路径时返回出勤统计面板前端页面"""
    html_path = os.path.join(static_dir, "index.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
    else:
        return HTMLResponse(
            content="""
            <html>
                <head><title>出勤统计系统</title></head>
                <body>
                    <h1>出勤统计系统</h1>
                    <p>静态文件未找到，请确保 index.html 已放置在 static 目录下</p>
                </body>
            </html>
            """,
            status_code=404
        )


@app.get("/vite.svg", include_in_schema=False)
async def vite_svg():
    """提供 vite.svg 文件"""
    svg_path = os.path.join(static_dir, "vite.svg")
    if os.path.exists(svg_path):
        return FileResponse(svg_path, media_type="image/svg+xml")
    else:
        return JSONResponse(content={"error": "SVG file not found"}, status_code=404)


# 挂载到统一前缀下，便于反向代理或与其他服务共存
ROOT_PATH = "/attendance-record"
root_app = FastAPI(title="出勤统计系统", version="1.0.0")
root_app.mount(ROOT_PATH, app)


@root_app.get("/", include_in_schema=False)
async def root_redirect():
    """访问根路径时自动重定向到 /attendance-record/"""
    return RedirectResponse(url="/attendance-record/", status_code=302)


# 对外暴露带前缀的 app，使 uvicorn main:app 与 python main.py 行为一致
app = root_app

if __name__ == "__main__":
    import uvicorn

    print(f"服务已启动: http://127.0.0.1:8000{ROOT_PATH}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
