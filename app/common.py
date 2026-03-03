from datetime import datetime, timedelta
from typing import List, Dict
from urllib.parse import unquote
import re
import base64
import json

user_infos = {}


def cookie_str_to_dict(cookie_str: str) -> dict:
    """
    将 Cookie 字符串转换为字典（处理编码、过滤属性、兼容特殊字符）

    Args:
        cookie_str: 原始 Cookie 字符串（如 "name=foo; age=20; Path=/"）

    Returns:
        解析后的 Cookie 字典（仅包含键值对主体）
    """
    cookie_dict = {}
    if not cookie_str.strip():
        return cookie_dict

    # 1. 分割多个 Cookie（处理可能的空格差异，如 ";  " 或 ";"）
    cookie_pairs = re.split(r';\s*', cookie_str.strip())

    for pair in cookie_pairs:
        # 2. 分割键值对（只分割第一个 "="，避免值中包含 "=" 的情况）
        if '=' not in pair:
            continue  # 跳过无效格式（如纯属性无键值对）

        key, value = pair.split('=', 1)

        # 3. 解码 URL 编码的字符（如 %20 -> 空格，%E4%B8%AD -> 中）
        key = unquote(key.strip())
        value = unquote(value.strip())

        # 4. 过滤 Cookie 属性（仅保留业务键值对，跳过 expires/path/domain 等）
        # 常见属性列表（可根据需求扩展）
        ignore_attrs = {'expires', 'path', 'domain', 'secure', 'httponly', 'samesite'}
        if key.lower() not in ignore_attrs:
            cookie_dict[key] = value

    return cookie_dict


def extract_jwt_hcm_uid(jwt_token: str) -> int | None:
    """
    解析JWT令牌，提取sub字段中的hcmUid值
    """
    try:
        # 方法1：不验证签名（仅解析payload，适用于已知可信的JWT）
        # 分割JWT，获取payload部分（中间那段）
        payload_base64 = jwt_token.split('.')[1]

        # JWT的Base64编码可能缺少填充，需要补全
        padding = '=' * ((4 - len(payload_base64) % 4) % 4)
        payload_base64 += padding

        payload_json = base64.urlsafe_b64decode(payload_base64).decode('utf-8')
        payload = json.loads(payload_json)

        # 提取sub字段（可能是字符串或字典）
        sub = payload.get('sub')
        if not sub:
            print("JWT中未找到sub字段")
            return None

        # 如果sub是字符串，需要先解析为字典
        if isinstance(sub, str):
            sub = json.loads(sub)

        # 提取hcmUid
        hcm_uid = sub.get('hcmUid')
        if not hcm_uid:
            print("sub字段中未找到hcmUid")
            return None
        return int(hcm_uid)
    except Exception as e:
        print(f"解析JWT时发生错误：{str(e)}")
        return None


def split_outing_by_day(
        begin_date_str: str,
        end_date_str: str,
        begin_time_str: str,
        end_time_str: str,
        work_start_time: str = "09:00",
        work_end_time: str = "18:00"
) -> dict[str, float]:
    """
    将跨天的外出记录拆分为每天的记录，并计算每天的外出时长

    参数:
        begin_date_str: 外出开始日期 (格式: YYYY-MM-DD)
        end_date_str: 外出结束日期 (格式: YYYY-MM-DD)
        begin_time_str: 外出开始时间 (格式: HH:MM)
        end_time_str: 外出结束时间 (格式: HH:MM)
        work_start_time: 每日工作开始时间 (默认: 09:00)
        work_end_time: 每日工作结束时间 (默认: 18:00)

    返回:
        包含每日外出记录的列表，每个元素包含日期、开始时间、结束时间、时长(小时)
    """
    # 时间格式
    begin_time_str = begin_time_str.replace("上午", "09:00")
    end_time_str = end_time_str.replace("上午", "13:30").replace("下午", "18:00")
    date_format = "%Y-%m-%d"
    time_format = "%H:%M"
    datetime_format = f"{date_format} {time_format}"

    # 解析外出开始/结束时间
    outing_begin = datetime.strptime(f"{begin_date_str} {begin_time_str}", datetime_format)
    outing_end = datetime.strptime(f"{end_date_str} {end_time_str}", datetime_format)

    # 解析每日工作时间
    work_start = datetime.strptime(work_start_time, time_format).time()
    work_end = datetime.strptime(work_end_time, time_format).time()

    daily_outings = {}
    current_date = outing_begin.date()

    # 遍历每一天
    while current_date <= outing_end.date():
        # 构建当天的工作时间边界
        day_start = datetime.combine(current_date, work_start)
        day_end = datetime.combine(current_date, work_end)

        # 确定当天实际的外出开始/结束时间（边界判断）
        actual_begin = max(outing_begin, day_start)
        actual_end = min(outing_end, day_end)

        # 计算当天外出时长（小时）
        if actual_begin < actual_end:
            duration_hours = (actual_end - actual_begin).total_seconds() / 3600
        else:
            duration_hours = 0.0

        # 格式化输出时间（只保留HH:MM）
        actual_begin_str = actual_begin.strftime(time_format)
        actual_end_str = actual_end.strftime(time_format)

        # 记录当天的外出信息
        daily_outings.update({current_date.strftime(date_format): round(duration_hours / 9, 1)
                              })

        # 切换到下一天
        current_date += timedelta(days=1)

    return daily_outings


# ------------------- 使用示例 -------------------
if __name__ == "__main__":
    # 你的JWT令牌
    moka_jwt = "eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxYjE1MWUwYTVlMmQ0ZmZiYmQ0OTAzZDJmYTQ3NWJjNiIsImlzcyI6Im1va2EiLCJhdWQiOiJtYWdlIiwiaWF0IjoxNzY0NDcwMTc4LCJzdWIiOiJ7XCJidXNcIjoyMCxcIm1va2FJZFwiOlwiMTIwNzExNjg4XCIsXCJhdHNVaWRcIjpcIjg2NDgxNTlcIixcImF0c09yZ0lkXCI6XCJib25yZWVcIixcImhjbVVpZFwiOlwiMTEyODg0NlwiLFwiaGNtVGVuYW50SWRcIjpcIjI4OFwifSIsImV4cCI6MTc2NTk0MTQwN30.MMglEySmN-yRlXFNiYeVObAu9QX0ILAHh4UzMZbclxw"

    # 提取hcmUid
    hcm_uid = extract_jwt_hcm_uid(moka_jwt)

    if hcm_uid:
        print(f"成功提取hcmUid：{hcm_uid}")  # 输出：成功提取hcmUid：1128846
    else:
        print("提取hcmUid失败")
    cookie_str = "arms_uid=794e4c65-d58a-43a0-aa0c-56884b056157; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2219a57040e1d4f0-0e52f2060a4109-4c657b58-2073600-19a57040e1e603%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%2C%22%24latest_landing_page%22%3A%22https%3A%2F%2Fcore.mokahr.com%2Floginreset%3Fidentifer%3Dfangmingkun%40bonree.com%26token%3D42f86bb85cc54a88b8d8165c13f909e1%26agvMH%3DMjRbg%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTlhNTcwNDBlMWQ0ZjAtMGU1MmYyMDYwYTQxMDktNGM2NTdiNTgtMjA3MzYwMC0xOWE1NzA0MGUxZTYwMyJ9%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%22%2C%22value%22%3A%22%22%7D%7D; gdxidpyhxdE=HbYdNDLBotl%2FyVyCkn7Kj3DuL7qlNEbp98%5CeEZn1bOog%2BG5lcjIRb0AZgSXBSJUDkrfQdZSw9SE3%2Fege%5CEXE1IXsUquyy%5CdXJATCY8Lj4Lc6NSumh2SvE398j9mMzqwSwI3R%2FvkekUGcuYWNn%2BwoqIzfJ3aSlh%5CuTRnREU%2FXT0dR%2FJ5I%3A1763655396511; acw_tc=ac11000117645797804772194ef2a962ed3d6c3a9f3c5bab94a8912cb5f5ee; Hm_lvt_81855791c290e31cd52ffbf04ad5c002=1763646828,1764333966,1764427245,1764579781; HMACCOUNT=2C4E887EE392BA83; c__utmb=759083666.698457656.1764579993.1764579993.1; c__utma=759083666.698457656.1504518829505918776.1764579993.1764579993.1; c__utmc=759083666.698457656; moka-jwt=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJhZDgyYWVjN2NmODg0Njg3ODcyM2VmZTc2NjBhZDQ2NSIsImlzcyI6Im1va2EiLCJhdWQiOiJtYWdlIiwiaWF0IjoxNzY0NTgwMTgyLCJzdWIiOiJ7XCJidXNcIjoyMCxcIm1va2FJZFwiOlwiMTIwNzExNjg4XCIsXCJhdHNVaWRcIjpcIjg2NDgxNTlcIixcImF0c09yZ0lkXCI6XCJib25yZWVcIixcImhjbVVpZFwiOlwiMTEyODg0NlwiLFwiaGNtVGVuYW50SWRcIjpcIjI4OFwifSIsImV4cCI6MTc2NjA1MTQxMX0.BTw2HRjAUorh69o-gBkItUJqbzyZ0_NiQulxjQxQmS4; moka-uid=eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiIyM2ZiMzIyYzJkZWY0NWZiOTIzYWVjN2Q4NjFiMjUzOSIsImlzcyI6Im1va2EiLCJhdWQiOiJoY20iLCJpYXQiOjE3NjQ1ODAxODIsInN1YiI6IntcImFpZFwiOjg2NDgxNTksXCJhb2lkXCI6XCJib25yZWVcIixcImJ1c1wiOjIwLFwiY2hcIjoyLFwiand0SWRcIjpcIjIzZmIzMjJjMmRlZjQ1ZmI5MjNhZWM3ZDg2MWIyNTM5XCIsXCJvaWRcIjpcImJvbnJlZVwiLFwicGlkXCI6MTEyODg0NixcInNidXNcIjoyMCxcInRpZFwiOjI4OCxcInR5cGVcIjozLFwidWlkXCI6MTIwNzExNjg4fSIsImV4cCI6MTc4MDEzMjE4Mn0.Cqf71ArD3hHpwHIO7xut6sY_2n-NBtmB7TLnCTd1vwyf21wVxQ_Q64KcdNOh3yTUpqmkOMgPgv-pI0ZBo07sGg; Hm_lpvt_81855791c290e31cd52ffbf04ad5c002=1764580183"
    cookie_dict = cookie_str_to_dict(cookie_str)
    print(extract_jwt_hcm_uid(cookie_dict.get('moka-jwt')))

    outing_record = {
        "beginDate": "2025-12-09",
        "endDate": "2025-12-20",
        "beginTime": "13:00",
        "endTime": "13:00"
    }

    # 拆分外出记录
    result = split_outing_by_day(
        begin_date_str=outing_record["beginDate"],
        end_date_str=outing_record["endDate"],
        begin_time_str=outing_record["beginTime"],
        end_time_str=outing_record["endTime"]
    )
    print(result)
