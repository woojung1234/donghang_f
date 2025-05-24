from fastapi import APIRouter

from app.service.chat_bot_service import get_chatbot_response

router = APIRouter(
    prefix="/api/v1",
    tags=["Chatbot"]
)

@router.get("/match")
async def match_endpoint():
    """
    프론트엔드가 요청하는 match 엔드포인트
    """
    return {"status": "success", "message": "Match API is working"}

@router.get("/conversation-room/last-conversation-time")
async def last_conversation_time():
    """
    프론트엔드가 요청하는 대화 시간 엔드포인트
    """
    return {"status": "success", "last_time": "2025-05-24T09:00:00"}

@router.get("/chatbot/chatting")
async def chatbot_response(contents: str):
    """
    챗봇 응답 API
    """
    response = get_chatbot_response(contents)
    return {"response": response}
