from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any

from app.service.chat_bot_service import get_chatbot_response

router = APIRouter(
    prefix="/api/v1",
    tags=["Chatbot"]
)

# 대화방 마지막 대화 시간 API
@router.get("/conversation-room/last-conversation-time")
async def last_conversation_time():
    """
    프론트엔드가 요청하는 마지막 대화 시간 엔드포인트
    """
    return {
        "status": "success", 
        "last_time": "2025-05-24T09:00:00"
    }

# 대화방 정보 API
@router.get("/conversation-room/{room_id}")
async def get_conversation_room(room_id: int):
    """
    대화방 정보를 반환하는 API
    """
    return {
        "status": "success",
        "conversationRoomNo": room_id,
        "created_at": "2025-05-24T09:00:00"
    }

# 대화방 생성 API
@router.post("/conversation-room")
async def create_conversation_room(data: dict = None):
    """
    대화방 생성 API
    """
    return {
        "status": "success",
        "conversationRoomNo": 1
    }

# 일치 정보 API
@router.get("/match")
async def match_endpoint():
    """
    프론트엔드가 요청하는 match 엔드포인트
    """
    return {
        "status": "success", 
        "message": "Match API is working"
    }

# 대화 처리 API
@router.post("/conversation")
async def process_conversation(data: dict):
    """
    대화 처리 API
    """
    try:
        input_text = data.get("input", "")
        room_no = data.get("conversationRoomNo", 1)
        
        # 챗봇 응답 생성
        response_text = get_chatbot_response(input_text)
        
        # 더미 오디오 데이터 (실제로는 TTS 서비스에서 생성해야 함)
        dummy_audio_data = ""
        
        return {
            "status": "success",
            "content": response_text,
            "audioData": dummy_audio_data,
            "actionRequired": False,
            "redirectionResult": None,
            "reservationResult": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 챗봇 응답 API
@router.get("/chatbot/chatting")
async def chatbot_response(contents: str):
    """
    챗봇 응답 API
    """
    response = get_chatbot_response(contents)
    return {"response": response}
