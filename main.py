"""
出勤统计系统入口

启动：
    python main.py
    或 uvicorn main:app --host 0.0.0.0 --port 8000
"""

from app.config import ROOT_PATH
from app.factory import create_app

app = create_app()

if __name__ == "__main__":
    import uvicorn

    print(f"服务已启动: http://127.0.0.1:8000{ROOT_PATH}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
