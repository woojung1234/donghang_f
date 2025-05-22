# 가져올 이미지 정의
FROM node:20-alpine as build
# 경로 설정
WORKDIR /app
# package.json 워킹 디렉토리에 복사
COPY package.json .
# 의존성 설치
RUN npm install
# 현재 디렉토리의 모든 파일을 도커 컨테이너의 워킹 디렉토리에 복사
COPY . .

# 애플리케이션 빌드
RUN npm run build
# 실행 단계
FROM nginx:alpine

# 빌드된 애플리케이션을 Nginx의 정적 파일 디렉토리로 복사
COPY --from=build /app/build /usr/share/nginx/html
# 컨테이너의 80번 포트 열어준다.
EXPOSE 80
# Nginx 서버 실행
CMD ["nginx", "-g", "daemon off;"]
