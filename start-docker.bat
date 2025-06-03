@echo off
echo 🚀 동행 프로젝트 도커 컨테이너 시작...

echo 🧹 기존 컨테이너 정리 중...
docker-compose down

echo 🏗️ 도커 이미지 빌드 및 컨테이너 시작...
docker-compose up -d --build

echo 📊 컨테이너 상태 확인...
docker-compose ps

echo.
echo 📝 로그 확인을 원하시면 다음 명령어를 사용하세요:
echo docker-compose logs -f [서비스명]
echo.
echo 사용 가능한 서비스:
echo - postgres (데이터베이스)
echo - backend (Node.js API 서버)
echo - ai-service (Python AI 서비스)
echo - frontend (React.js 개발 서버)
echo.
echo 🌐 접속 URL:
echo - 프론트엔드: http://localhost:3000
echo - 백엔드 API: http://localhost:5000
echo - AI 서비스: http://localhost:8000
echo - 데이터베이스: localhost:5432
echo.
echo ✅ 모든 서비스가 시작되었습니다!
pause
