# 出勤统计系统镜像
FROM python:3.12-slim

WORKDIR /work

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com

COPY app/ ./app
COPY panel/dist ./panel/dist
COPY main.py .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV TZ=Asia/Shanghai
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
