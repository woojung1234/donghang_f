# Python AI 서비스용 Dockerfile
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 필요한 시스템 패키지 설치 (MeCab 포함)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 생성 및 복사
COPY requirements.txt ./

# Python 패키지 설치 (PyTorch CPU 버전)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.2.0 torchaudio==2.2.0 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# 애플리케이션 시작
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]