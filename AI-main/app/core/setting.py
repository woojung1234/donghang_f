from pydantic_settings import BaseSettings
from pydantic import ConfigDict, ValidationError
from dotenv import load_dotenv
import os

from . import logger

load_dotenv()

class APIKeyValidationError(Exception):
    pass

class Settings(BaseSettings):
    # OpenAI API 키
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "sk-dummy-key-for-testing")

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding='utf-8'
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
