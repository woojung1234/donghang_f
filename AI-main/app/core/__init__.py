import sys
import logging

# 기본 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# 설정 로딩 시도
try:
    from .setting import settings
except Exception as e:
    logger.error(f"Failed to load settings: {str(e)}")
    # 임시 설정 객체 생성
    class DummySettings:
        openai_api_key = "sk-dummy-key-for-testing"
    settings = DummySettings()
    logger.warning("Using dummy settings for now")

# lifespan 로딩 시도
try:
    from .lifespan_config import lifespan
except Exception as e:
    logger.error(f"Failed to load lifespan: {str(e)}")
    # 임시 lifespan 함수 생성
    async def lifespan(app):
        logger.info("Starting application with dummy lifespan")
        yield
        logger.info("Shutting down application with dummy lifespan")
    logger.warning("Using dummy lifespan for now")
