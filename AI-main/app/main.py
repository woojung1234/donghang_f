import logging
from fastapi import FastAPI, Query, Request
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

# CORS 미들웨어 추가
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

# 챗봇 서비스 함수 직접 임포트 (전역에서)
try:
    from app.service.chat_bot_service import get_chatbot_response
    logger.info("✅ 챗봇 서비스 로드 성공")
    chatbot_service_available = True
except Exception as e:
    logger.error(f"❌ 챗봇 서비스 로드 실패: {str(e)}")
    chatbot_service_available = False
    def get_chatbot_response(text):
        return f"챗봇 서비스 로드 실패: {text}에 대한 응답을 처리할 수 없습니다."

# 라우터 등록 시도
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

# 프론트엔드에서 요청하는 모든 챗봇 엔드포인트들을 직접 등록
@app.get("/api/v1/chatbot/chatting")
async def chatbot_main(contents: str = Query(...), request: Request = None):
    """메인 챗봇 엔드포인트"""
    try:
        client_host = request.client.host if request and request.client else "unknown"
        logger.info(f"[MAIN] 챗봇 API 호출 - 클라이언트: {client_host}, 입력: {contents}")
        
        response = get_chatbot_response(contents)
        logger.info(f"[MAIN] 챗봇 응답: {response[:100]}...")
        
        return {"response": response}
    except Exception as e:
        logger.error(f"[MAIN] 챗봇 응답 오류: {str(e)}")
        return {"error": str(e), "response": "죄송합니다. 현재 서비스에 문제가 있습니다."}

@app.get("/api/v1/chatbot/chatting-direct")
async def chatbot_direct(contents: str = Query(...), request: Request = None):
    """직접 챗봇 엔드포인트"""
    try:
        client_host = request.client.host if request and request.client else "unknown"
        logger.info(f"[DIRECT] 챗봇 API 호출 - 클라이언트: {client_host}, 입력: {contents}")
        
        response = get_chatbot_response(contents)
        logger.info(f"[DIRECT] 챗봇 응답: {response[:100]}...")
        
        return {"response": response}
    except Exception as e:
        logger.error(f"[DIRECT] 챗봇 응답 오류: {str(e)}")
        return {"error": str(e), "response": "죄송합니다. 현재 서비스에 문제가 있습니다."}

@app.get("/api/v1/chatbot/chatting-backup")
async def chatbot_backup(contents: str = Query(...), request: Request = None):
    """백업 챗봇 엔드포인트"""
    try:
        client_host = request.client.host if request and request.client else "unknown"
        logger.info(f"[BACKUP] 챗봇 API 호출 - 클라이언트: {client_host}, 입력: {contents}")
        
        response = get_chatbot_response(contents)
        logger.info(f"[BACKUP] 챗봇 응답: {response[:100]}...")
        
        return {"response": response}
    except Exception as e:
        logger.error(f"[BACKUP] 챗봇 응답 오류: {str(e)}")
        return {"error": str(e), "response": "죄송합니다. 현재 서비스에 문제가 있습니다."}

# OPTIONS 요청 처리
@app.options("/api/v1/chatbot/chatting")
async def chatbot_options():
    return {"message": "OK"}

@app.options("/api/v1/chatbot/chatting-direct")
async def chatbot_direct_options():
    return {"message": "OK"}

@app.options("/api/v1/chatbot/chatting-backup")
async def chatbot_backup_options():
    return {"message": "OK"}

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
    return {
        "routes": routes_info,
        "chatbot_service": "Available" if chatbot_service_available else "Not Available"
    }

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
    logger.info(f"🤖 챗봇 서비스 상태: {'사용 가능' if chatbot_service_available else '사용 불가'}")
    
    uvicorn.run(
        "app.main:app", 
        host=host, 
        port=port, 
        reload=True,
        log_level="info"
    )
