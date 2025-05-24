import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# 핵심 모듈 로드
try:
    from app.core import lifespan
except Exception as e:
    logger.error(f"Error loading lifespan: {str(e)}")
    # 임시 lifespan 함수 정의
    async def lifespan(app):
        logger.info("Starting application with dummy lifespan")
        yield
        logger.info("Shutting down application with dummy lifespan")

# FastAPI 앱 생성
app = FastAPI(
    title="동행 AI 서비스",
    description="동행 챗봇 및 음성 서비스 API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 미들웨어 추가 - 프론트엔드와의 통신을 위해 필요
allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"]
)

# 메인 라우터 등록
try:
    from app.api.v1.chatbot_router import router as chatbot_router
    app.include_router(chatbot_router)
    logger.info("✅ 챗봇 라우터 등록 성공")
except Exception as e:
    logger.error(f"❌ 챗봇 라우터 등록 실패: {str(e)}")

# 기본 경로
@app.get("/")
async def root():
    return {"message": "동행 AI 서비스에 오신 것을 환영합니다!", "status": "running"}

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 직접 라우트 등록 (백업용)
@app.get("/api/v1/chatbot/chatting-direct")
async def chatbot_response_direct(contents: str):
    """백업용 직접 등록 라우트"""
    from app.service.chat_bot_service import get_chatbot_response
    response = get_chatbot_response(contents)
    logger.info(f"직접 라우트 호출 - 입력: {contents}, 응답: {response[:50]}...")
    return {"response": response}

# 서버 실행 코드 추가
if __name__ == "__main__":
    from app.core.setting import settings
    
    # 환경 변수에서 가져온 설정 값으로 서버 실행
    host = settings.host
    port = int(settings.port)
    
    logger.info(f"🚀 서버 시작: {host}:{port}")
    logger.info(f"🌐 CORS 허용 도메인: {', '.join(allowed_origins)}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
