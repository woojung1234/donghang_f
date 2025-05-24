from pydantic_settings import BaseSettings
from pydantic import ConfigDict, ValidationError
from dotenv import load_dotenv
import os
import logging

# 로깅 설정을 여기에서 직접 수행
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

load_dotenv()

class APIKeyValidationError(Exception):
    pass

class Settings(BaseSettings):
    # OpenAI API 키 (필수)
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "dummy-key")
    
    # 서버 설정 (선택적)
    port: str = os.getenv("PORT", "8000")
    host: str = os.getenv("HOST", "0.0.0.0")
    debug: str = os.getenv("DEBUG", "False")
    
    # 모델 설정 (선택적)
    default_model: str = os.getenv("DEFAULT_MODEL", "gpt-3.5-turbo")
    system_prompt: str = os.getenv("SYSTEM_PROMPT", "You are a helpful assistant.")
    
    # 외부 서비스 (선택적)
    backend_api_url: str = os.getenv("BACKEND_API_URL", "http://localhost:9090/api/v1")
    
    # 로깅 (선택적)
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # 오프라인 모드 (API 키 없을 때 로컬 응답 사용)
    offline_mode: bool = os.getenv("OFFLINE_MODE", "False").lower() in ("true", "1", "yes")
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        extra="ignore"  # 추가 필드 허용
    )

# 설정 로드 시도
try:
    settings = Settings()
    
    # 로깅
    logger.info("✅ Settings loaded successfully.")
    logger.info(f"💻 Server: {settings.host}:{settings.port}")
    logger.info(f"🔄 Offline mode: {'Enabled' if settings.offline_mode else 'Disabled'}")
    
    # API 키 로깅 (보안상의 이유로 일부만 표시)
    if not settings.offline_mode and settings.openai_api_key != "dummy-key":
        masked_key = settings.openai_api_key[:4] + "*" * (len(settings.openai_api_key) - 8) + settings.openai_api_key[-4:]
        logger.info(f"🔑 API Key: {masked_key}")
    else:
        if settings.offline_mode:
            logger.info("🔑 API Key: Not required (offline mode)")
        else:
            logger.warning("⚠️ API Key: Not set or using dummy key")
            
except ValidationError as e:
    logger.error(f"❌ Error loading settings: {str(e)}")
    # 오류가 발생해도 기본 설정으로 계속 진행
    settings = Settings(openai_api_key="dummy-key", offline_mode=True)
    logger.warning("⚠️ Using default settings due to validation error.")

# 명시적으로 settings 객체 내보내기
__all__ = ['settings']
