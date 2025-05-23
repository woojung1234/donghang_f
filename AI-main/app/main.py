import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# API 라우터 로드
try:
    from app.api.v1 import chatbot_router
except Exception as e:
    logger.error(f"Error loading chatbot_router: {str(e)}")
    # 계속 진행, 최소한 애플리케이션은 시작할 수 있도록

# 기타 라우터 로드 시도 (선택적)
try:
    from app.api.v1 import tts_router, etc_router
    has_extra_routers = True
except Exception as e:
    logger.error(f"Error loading extra routers: {str(e)}")
    has_extra_routers = False

# FastAPI 앱 생성
app = FastAPI(
    title="동행 AI 서비스",
    description="동행 챗봇 및 음성 서비스 API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 미들웨어 추가 - 프론트엔드와의 통신을 위해 필요
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 출처만 허용하도록 수정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록 - 사용 가능한 라우터만 등록
try:
    app.include_router(chatbot_router.router)
    logger.info("Chatbot router registered successfully")
except Exception as e:
    logger.error(f"Failed to register chatbot router: {str(e)}")

# 추가 라우터가 로드되었다면 등록
if has_extra_routers:
    try:
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
