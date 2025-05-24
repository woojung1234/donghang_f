import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# 모델 다운로드 시도 - 실패해도 계속 진행
try:
    from app.utils import download_model
    download_model()
    logger.info("Model download process completed")
except Exception as e:
    logger.error(f"Error during model download: {str(e)}")
    logger.warning("Continuing without model download")

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

# 수동으로 라우터 구성
from app.api.v1.chatbot_router import router as chatbot_router

# 라우터 등록
app.include_router(chatbot_router)
logger.info("Chatbot router registered successfully")

# 기타 라우터 로드 시도 (선택적)
try:
    from app.api.v1 import tts_router, etc_router
    app.include_router(tts_router.router)
    app.include_router(etc_router.router)
    logger.info("Extra routers registered successfully")
except Exception as e:
    logger.error(f"Failed to register extra routers: {str(e)}")

# 기본 경로
@app.get("/")
async def root():
    return {"message": "동행 AI 서비스에 오신 것을 환영합니다!", "status": "running"}

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 서버 실행 코드 추가
if __name__ == "__main__":
    from app.core.setting import settings
    
    # 환경 변수에서 가져온 설정 값으로 서버 실행
    host = settings.host
    port = int(settings.port)
    
    logger.info(f"Starting server on {host}:{port}")
    logger.info(f"CORS Origins: {', '.join(allowed_origins)}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
