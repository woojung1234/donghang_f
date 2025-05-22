from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core import logger
from app.service.melo_tts_service import convert_text_to_speech
from app.service.openai_tts_service import convert_text_to_speech_openai

router = APIRouter(
    prefix="/api/v1/tts",
    tags=["Auth"]
)

@router.get("/melo")
async def melo_tts(contents: str):
    logger.info(f"📌 input contents: \"{contents}\"")
    buffer = convert_text_to_speech(contents)
    return StreamingResponse(buffer, media_type="audio/wav")
    
@router.get("/openai")
async def openai_tts(contents: str):
    logger.info(f"📌 input contents: \"{contents}\"")
    buffer = convert_text_to_speech_openai(contents)
    return StreamingResponse(buffer, media_type="audio/wav")
    