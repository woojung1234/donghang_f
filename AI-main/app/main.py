import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("app")

# 핵심 모듈 로드
try:
    from app.core import lifespan
    logger.info("✅ Lifespan 모듈 로드 성공")
except Exception as e:
    logger.error(f"❌ Lifespan 모듈 로드 실패: {str(e)}")
    # 임시 lifespan 함수 정의
    async def lifespan(app):
        logger.info("🚀 애플리케이션 시작 (기본 lifespan)")
        yield
        logger.info("🛑 애플리케이션 종료 (기본 lifespan)")

# FastAPI 앱 생성
app = FastAPI(
    title="동행 AI 서비스",
    description="동행 챗봇 및 음성 서비스 API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 미들웨어 추가 - 더 넓은 허용 범위로 설정
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "*"  # 개발 환경에서는 모든 도메인 허용
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"]
)

# 라우터 등록
def register_routers():
    """라우터들을 안전하게 등록"""
    routers_to_register = [
        ("app.api.v1.chatbot_router", "챗봇"),
        ("app.api.v1.tts_router", "TTS"),
        ("app.api.v1.etc_router", "기타")
    ]
    
    for module_path, name in routers_to_register:
        try:
            module = __import__(module_path, fromlist=["router"])
            router = getattr(module, "router")
            app.include_router(router)
            logger.info(f"✅ {name} 라우터 등록 성공")
        except Exception as e:
            logger.error(f"❌ {name} 라우터 등록 실패: {str(e)}")
            continue

# 라우터 등록 실행
register_routers()

# 기본 경로들
@app.get("/")
async def root():
    return {
        "message": "동행 AI 서비스에 오신 것을 환영합니다!", 
        "status": "running",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "donghang-ai"}

# 백업용 직접 라우트 (문제 해결을 위한 임시)
@app.get("/api/v1/chatbot/chatting-backup")
async def chatbot_backup(contents: str):
    """백업용 챗봇 엔드포인트"""
    try:
        from app.service.chat_bot_service import get_chatbot_response
        response = get_chatbot_response(contents)
        logger.info(f"백업 라우트 사용 - 입력: {contents}")
        return {"response": response}
    except Exception as e:
        logger.error(f"백업 라우트 오류: {str(e)}")
        return {"error": str(e), "response": "죄송합니다. 현재 서비스에 문제가 있습니다."}

# 디버깅을 위한 라우트 정보 출력
@app.get("/debug/routes")
async def debug_routes():
    """등록된 라우트 정보 확인용"""
    routes_info = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes_info.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else [],
                "name": getattr(route, 'name', 'unknown')
            })
    return {"routes": routes_info}

# 서버 실행
if __name__ == "__main__":
    try:
        from app.core.setting import settings
        host = settings.host
        port = int(settings.port)
    except Exception as e:
        logger.warning(f"설정 파일 로드 실패, 기본값 사용: {e}")
        host = "127.0.0.1"
        port = 8000
    
    logger.info(f"🚀 서버 시작: {host}:{port}")
    logger.info(f"🌐 CORS 설정: {allowed_origins}")
    
    uvicorn.run(
        "app.main:app", 
        host=host, 
        port=port, 
        reload=True,
        log_level="info"
    )
