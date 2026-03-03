import asyncio
from datetime import date, datetime
from httpx import AsyncClient

from app.common import split_outing_by_day
from app.http_utils import AsyncHttpTool
from app.models import CheckInOut, DailyAttendance


def get_day_info(target_date: date | str = None) -> tuple[int, int]:
    """
    获取日期的「本月第几天」和「本周星期几（星期一=0）」

    Args:
        target_date: 目标日期，支持 date 对象或字符串（格式：YYYY-MM-DD），默认当前日期

    Returns:
        tuple: (本月第几天, 本周星期几)
    """
    # 处理输入：如果是字符串，转换为date对象；默认当前日期
    if target_date is None:
        dt = date.today()
    elif isinstance(target_date, str):
        dt = datetime.strptime(target_date, "%Y-%m-%d").date()
    else:
        dt = target_date

    day_of_month = dt.day  # 本月第几天（1-31）
    day_of_week = dt.weekday()

    return day_of_month, day_of_week


def get_check_in_out_info(attendance_time: dict,
                          target_day: str,
                          shift_data: dict[str, str]) -> (list[CheckInOut], str, float):
    """
    处理打卡数据，返回打卡对象列表

    Args:
        attendance_time: 打卡数据

    Returns:
        list: 打卡对象列表
    """
    result = []
    check_in_time = None
    check_out_time = None
    if attendance_time:
        if "clockInTime" in attendance_time and attendance_time["clockInTime"]:
            check_in_time = attendance_time["clockInTime"].split(" ")[1]
            result.append(CheckInOut(time=check_in_time, type='in'))
        if "clockOutTime" in attendance_time and attendance_time["clockOutTime"]:
            check_out_time = attendance_time["clockOutTime"].split(" ")[1]
            result.append(CheckInOut(time=check_out_time, type='out'))
    status = 'none'
    work_hours = 0.0
    if len(result) == 2:
        in_h, in_m = map(int, check_in_time.split(':'))
        out_h, out_m = map(int, check_out_time.split(':'))
        if out_h < in_h:
            out_h += 24
        work_minutes = (out_h * 60 + out_m) - (in_h * 60 + in_m)
        work_hours = round(work_minutes / 60, 1)
        if work_hours >= 11:
            status = 'overtime'
        elif work_hours >= 9:
            status = 'present'
        else:
            status = 'early_leave'
    if len(result) == 1:
        status = 'early_leave'
    if shift_data[target_day] == 'holiday':
        status = 'holiday'
        work_hours = 0.0
    return result, status, work_hours


async def get_shift_data(client: AsyncClient, year: int, month: int) -> dict:
    url = "https://core.mokahr.com/api/abs/attendance/calendar/v1/m/list?bus=20"
    request_body = {
        "loginType": "10",
        "year": year,
        "month": month
    }
    try:
        print(f"📡 获取 {year} 年 {month} 月的排班数据...")
        response = await client.post(url=url, json=request_body)
        response.raise_for_status()
        response_data = response.json()
        holiday_data = {}
        for days in response_data["data"]["days"]:
            if not days['shiftId']:
                holiday_data[days['day']] = 'holiday'
            else:
                holiday_data[days['day']] = 'workday'
        return holiday_data
    except Exception as e:
        print(f"⚠️ 获取排班数据发生异常: {e}")
        return {}


async def get_daily_attendance(
        client: AsyncClient,  # 接收登录成功的client实例
        target_year: int,
        target_month: int,
        target_day: str,
        employee_id: int,
        shift_data: dict[str, str]
) -> DailyAttendance:
    url = "https://core.mokahr.com/api/abs/attendance/myAttendance/v2/m/detail?bus=20"
    request_body = {
        "loginType": "10",
        "year": target_year,
        "month": target_month,
        "startDate": target_day,
        "endDate": target_day,
        "fieldVisiblePageEnum": "VISIBLE_DAY",
        "employeeId": employee_id
    }
    try:
        print(f"📡 正在获取 {target_day} 的考勤数据...")
        # 使用传入的client发起请求
        response = await client.post(url=url, json=request_body)
        response.raise_for_status()
        attendance_data = response.json()
        attendance_time = None
        leave_days = 0.0
        out_days = 0.0
        if attendance_data["data"]["detail"]["myAttendanceAttendanceRecord#clockInAndOutTime"]["fieldValue"]:
            attendance_time = attendance_data["data"]["detail"]["myAttendanceAttendanceRecord#clockInAndOutTime"]["fieldValue"][0]
        if attendance_data["data"]["detail"]["myAttendanceAttendanceRecord#leaveRecord"]["fieldValue"]:
            leave_days = sum(split_outing_by_day(leave['beginDate'], leave['endDate'],
                                               leave['beginTime'], leave['endTime']).get(target_day, 0.0)
                           for leave in attendance_data["data"]["detail"]["myAttendanceAttendanceRecord#leaveRecord"]["fieldValue"])
        if attendance_data["data"]["detail"]["myAttendanceAttendanceRecord#outRecord"]["fieldValue"]:
            out_days = sum(split_outing_by_day(leave['beginDate'], leave['endDate'],
                                               leave['beginTime'], leave['endTime']).get(target_day, 0.0)
                           for leave in attendance_data["data"]["detail"]["myAttendanceAttendanceRecord#outRecord"]["fieldValue"])
        day_info = get_day_info(target_day)
        check_in_out_info = get_check_in_out_info(attendance_time, target_day, shift_data)
        status = "none"
        if out_days > 0.0:
            status = 'out'
        elif leave_days > 0.0:
            status = 'leave'
        else:
            status = check_in_out_info[1]

        return DailyAttendance(date=day_info[0],
                               dayOfWeek=day_info[1],
                               isHoliday=shift_data[target_day] == 'holiday',
                               checkIns=check_in_out_info[0],
                               status=status,
                               workHours=check_in_out_info[2],
                               leaveDays=leave_days,
                               outDays=out_days)
    except Exception as e:
        print(f"⚠️ 获取考勤数据发生异常: {e}")
        raise None


async def main():
    http_tool = AsyncHttpTool()
    try:
        # 1. 登录并获取client实例
        client = await http_tool.login("xxx@bonree.com", "xxxx")
        if not client:
            print("登录失败，退出。")
            return
        holiday_data = await get_shift_data(client, 2025, 11)

        # 2. 显式传递client到后续接口
        data = await get_daily_attendance(
            client=client,
            target_year=2025,
            target_month=11,
            target_day="2025-11-12",
            employee_id=1128846,
            shift_data=holiday_data
        )
        print("✅ 打卡记录:", data)
    except Exception as e:
        print(f"⚠️ 发生异常: {e}")
    finally:
        await http_tool.logout()


if __name__ == "__main__":
    asyncio.run(main())
