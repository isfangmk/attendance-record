# 使用官方Python镜像作为基础镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /work


# 复制项目依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制项目所有文件到工作目录
COPY app/  ./app
COPY panel/dist ./panel/dist
COPY main.py  .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
ENV TZ=Asia/Shanghai
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]