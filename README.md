# 出勤统计系统

基于 Moka HR 的出勤查看面板：登录后按月展示打卡、请假、外出与餐补统计，并支持企业微信打卡提醒。

## 功能

- Cookie / 账号密码登录 Moka
- 月度日历与汇总（出勤、平均工时、早退、请假、外出、餐补）
- 餐补日期一键生成申请文案
- 定时检查当日是否打卡并推送企业微信（可选）

## 目录结构

```text
attendance-record/
├── main.py                 # 启动入口
├── app/
│   ├── factory.py          # FastAPI 工厂
│   ├── config.py           # 环境配置
│   ├── api/routes/         # HTTP 路由
│   ├── domain/             # 纯业务规则（可单测）
│   ├── integrations/moka/  # Moka 接口客户端
│   ├── services/           # 应用服务
│   └── models/             # Pydantic 模型
├── tests/unit/             # 后端单元测试
└── panel/                  # React 前端
```

## 环境要求

- Python 3.11+
- Node.js 20+

## 后端

```bash
pip install -r requirements-dev.txt -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
python main.py
```

服务地址：`http://127.0.0.1:8000/attendance-record/`

### 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `WECHAT_WEBHOOK_URL` | 企业微信机器人 Webhook（也可在面板「配置」中设置） | 空（跳过推送） |
| `ATTENDANCE_PANEL_URL` | 推送卡片跳转链接 | `http://127.0.0.1:8000/attendance-record/` |
| `CHECKIN_CRON_HOUR` / `CHECKIN_CRON_MINUTE` | 打卡检查时间 | `9` / `50` |
| `ATTENDANCE_ROOT_PATH` | URL 前缀 | `/attendance-record` |

登录后右上角「提醒配置」可按账号保存 Webhook 与提醒时间；写入本地 `settings.json`（已 gitignore），各用户互不影响。

### 测试

```bash
pytest
```

## 前端

```bash
cd panel
npm install
npm run dev
```

生产构建：

```bash
cd panel
npm run build
```

构建产物输出到 `panel/dist`，由后端静态托管。

### 测试

```bash
cd panel
npm run test:run
```

## Docker

先构建前端，再构建镜像：

```bash
cd panel && npm ci && npm run build && cd ..
docker build -t attendance-record .
docker run -p 8000:8000 -e WECHAT_WEBHOOK_URL=... attendance-record
```

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/attendance-record/api/login` | 密码登录 |
| POST | `/attendance-record/api/cookie-login` | Cookie 登录 |
| POST | `/attendance-record/api/logout` | 登出 |
| POST | `/attendance-record/api/attendance` | 查询月度出勤 |
| POST | `/attendance-record/api/check-today` | 手动触发打卡检查 |

响应壳：`{ "msg": string, "data": object | null }`。

出勤 `data` 字段（camelCase）：`daysInMonth`、`firstWeekday`、`summary`、`days`；单日状态含 `present` / `early_leave` / `meal_allowance` / `leave` / `outing` / `rest` / `none`。
