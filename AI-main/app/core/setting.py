from pydantic_settings import BaseSettings
from pydantic import ConfigDict, ValidationError
from dotenv import load_dotenv

from . import logger

load_dotenv()

class APIKeyValidationError(Exception):
    pass

class Settings(BaseSettings):
    # GOOGLE LOGIN
    openai_api_key: str

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding='utf-8'
    )

try:
    settings = Settings()
    logger.info("✅ Settings loaded successfully.")
except ValidationError as e:
    logger.error("❌ Error loading settings:")