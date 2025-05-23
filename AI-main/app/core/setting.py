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
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "sk-dummy-key-for-testing")
    
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
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        extra="ignore"  # 추가 필드 허용
    )

# 설정 로드 시도
try:
    settings = Settings()
    logger.info("✅ Settings loaded successfully.")
except ValidationError as e:
    logger.error(f"❌ Error loading settings: {str(e)}")
    # 오류가 발생해도 기본 설정으로 계속 진행
    settings = Settings(openai_api_key="sk-dummy-key-for-testing")
    logger.warning("⚠️ Using default settings due to validation error.")

# 명시적으로 settings 객체 내보내기
__all__ = ['settings']
