# 빌드 단계
FROM python:3.10-slim-buster AS builder

WORKDIR /app

# MeCab 및 필요한 라이브러리 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    build-essential \
    curl \
    xz-utils \
    file \
    git \
    && rm -rf /var/lib/apt/lists/*

# 최신 pip과 pipenv를 설치합니다.
RUN pip install --no-cache-dir --upgrade pip \
    && pip install pipenv
    
# Pipfile과 Pipfile.lock을 복사합니다.
COPY Pipfile Pipfile.lock ./

# 프로젝트의 의존성을 설치합니다.
RUN pipenv install --system --deploy --ignore-pipfile

# 최종 단계
FROM python:3.10-slim-buster

WORKDIR /app

# 필요한 패키지를 설치합니다.
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 빌드 단계에서 설치된 패키지를 복사합니다.
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 소스 코드를 복사합니다.
COPY . .

# FastAPI 애플리케이션을 시작합니다.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]