from fastapi import APIRouter

from app.service.chat_bot_service import get_chatbot_response

router = APIRouter(
    prefix="/api/v1/chatbot",
    tags=["Auth"]
)

@router.get("/chatting")
async def melo_tts(contents: str):
    response = get_chatbot_response(contents)
    return {"response": response}