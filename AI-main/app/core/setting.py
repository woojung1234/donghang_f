from pydantic_settings import BaseSettings
from pydantic import ConfigDict, ValidationError
from dotenv import load_dotenv
import os
import logging

# 로깅 설정을 여기에서 직접 수행
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# .env 파일 로드
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
    system_prompt: str = os.getenv("SYSTEM_PROMPT", "당신은 '금복이'이라는 이름의 노인분들을 위한 친절한 AI 도우미입니다. 음성으로 소비내역을 말하면 자동으로 가계부에 기록해드리고, 간단명료하게 대답해주세요.")
    
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
    
    def is_valid_openai_key(self) -> bool:
        """OpenAI API 키가 유효한지 확인"""
        if not self.openai_api_key or self.openai_api_key == "dummy-key":
            return False
        
        # OpenAI API 키 형식 확인 (sk-로 시작하는 51자 길이)
        if self.openai_api_key.startswith("sk-") and len(self.openai_api_key) >= 48:
            return True
        
        return False

# 설정 로드 시도
try:
    settings = Settings()
    
    # 로깅
    logger.info("✅ Settings loaded successfully.")
    logger.info(f"💻 Server: {settings.host}:{settings.port}")
    
    # API 키 유효성 검사
    api_key_valid = settings.is_valid_openai_key()
    
    # 오프라인 모드 결정
    if settings.offline_mode:
        logger.info("🔄 Offline mode: Enabled (forced)")
        logger.info("🔑 API Key: Not required (offline mode)")
    elif api_key_valid:
        logger.info("🔄 Offline mode: Disabled")
        masked_key = settings.openai_api_key[:7] + "*" * (len(settings.openai_api_key) - 11) + settings.openai_api_key[-4:]
        logger.info(f"🔑 API Key: {masked_key}")
    else:
        logger.warning("⚠️ Invalid or missing OpenAI API key, enabling offline mode")
        logger.info("🔄 Offline mode: Enabled (auto)")
        logger.info("🔑 API Key: Invalid - using offline responses")
        # 자동으로 오프라인 모드로 설정
        settings.offline_mode = True
            
except ValidationError as e:
    logger.error(f"❌ Error loading settings: {str(e)}")
    # 오류가 발생해도 기본 설정으로 계속 진행
    settings = Settings(openai_api_key="dummy-key", offline_mode=True)
    logger.warning("⚠️ Using default settings due to validation error.")

# 명시적으로 settings 객체 내보내기
__all__ = ['settings']