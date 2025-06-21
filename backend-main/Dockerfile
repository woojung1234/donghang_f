# Node.js 백엔드용 Dockerfile
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (개발 의존성 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 9090

# 헬스체크 추가
#HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#  CMD curl -f http://localhost:5000/api/health || exit 1

# 애플리케이션 시작
CMD ["npm", "run", "dev"]
