from fastapi import APIRouter, HTTPException, Body, Query, Response
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from app.service.chat_bot_service import get_chatbot_response

class ConversationInput(BaseModel):
    input: str
    conversationRoomNo: int = 1

class RoomCreate(BaseModel):
    roomName: Optional[str] = None
    userId: Optional[int] = None

class ConversationResponse(BaseModel):
    status: str = "success"
    content: str
    audioData: str = ""
    actionRequired: bool = False
    redirectionResult: Optional[Dict[str, Any]] = None
    reservationResult: Optional[Dict[str, Any]] = None

router = APIRouter(
    tags=["Chatbot"]
)

# 대화방 마지막 대화 시간 API
@router.get("/api/v1/conversation-room/last-conversation-time")
async def last_conversation_time():
    """
    프론트엔드가 요청하는 마지막 대화 시간 엔드포인트
    """
    return {
        "status": "success", 
        "last_time": "2025-05-24T09:00:00"
    }

# 대화방 정보 API
@router.get("/api/v1/conversation-room/{room_id}")
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
@router.post("/api/v1/conversation-room")
async def create_conversation_room(data: Optional[RoomCreate] = Body(default=None)):
    """
    대화방 생성 API
    """
    return {
        "status": "success",
        "conversationRoomNo": 1
    }

# 일치 정보 API
@router.get("/api/v1/match")
async def match_endpoint():
    """
    프론트엔드가 요청하는 match 엔드포인트
    """
    return {
        "status": "success", 
        "message": "Match API is working"
    }

# 대화 처리 API
@router.post("/api/v1/conversation")
async def process_conversation(data: ConversationInput):
    """
    대화 처리 API
    """
    try:
        input_text = data.input
        room_no = data.conversationRoomNo
        
        # 챗봇 응답 생성
        response_text = get_chatbot_response(input_text)
        
        # 응답 구성
        return ConversationResponse(
            status="success",
            content=response_text,
            audioData="",
            actionRequired=False,
            redirectionResult=None,
            reservationResult=None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 챗봇 응답 API
@router.get("/api/v1/chatbot/chatting")
async def chatbot_response(contents: str = Query(...)):
    """
    챗봇 응답 API
    """
    response = get_chatbot_response(contents)
    return {"response": response}
