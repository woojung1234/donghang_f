from fastapi import FastAPI

from app.utils import download_model
download_model()
from app.core import lifespan
from app.api.v1 import tts_router, chatbot_router, etc_router

app = FastAPI(
    lifespan=lifespan
)

# Including API routers
app.include_router(tts_router.router)
app.include_router(chatbot_router.router)
app.include_router(etc_router.router)
