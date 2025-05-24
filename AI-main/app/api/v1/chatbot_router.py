from fastapi import APIRouter, HTTPException, Body, Query, Response, Request
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import logging

from app.service.chat_bot_service import get_chatbot_response

# 로거 설정
logger = logging.getLogger(__name__)

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

# APIRouter 인스턴스 생성
router = APIRouter(
    prefix="",  # 접두사 없음
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

# 대화방 생성 API - 수정: Body의 기본값 처리 개선
@router.post("/api/v1/conversation-room")
async def create_conversation_room(data: RoomCreate = Body(default_factory=RoomCreate)):
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
async def process_conversation(data: ConversationInput, request: Request):
    """
    대화 처리 API
    """
    try:
        # 요청 로깅
        client_host = request.client.host if request.client else "unknown"
        logger.info(f"대화 처리 API 호출 - 클라이언트: {client_host}, 입력: {data.input}")
        
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
        logger.error(f"대화 처리 오류: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# 챗봇 응답 API - CORS 처리 개선
@router.get("/api/v1/chatbot/chatting")
async def chatbot_response(contents: str = Query(...), request: Request = None):
    """
    챗봇 응답 API
    """
    try:
        # 요청 로깅
        client_host = request.client.host if request and request.client else "unknown"
        logger.info(f"챗봇 API 호출 - 클라이언트: {client_host}, 입력: {contents}")
        
        response = get_chatbot_response(contents)
        logger.info(f"챗봇 응답: {response[:100]}...")
        
        return {"response": response}
    except Exception as e:
        logger.error(f"챗봇 응답 오류: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail={
            "error": "Internal Server Error",
            "message": "챗봇 응답을 처리하는 중 오류가 발생했습니다.",
            "details": str(e)
        })

# OPTIONS 요청 처리를 위한 추가 엔드포인트
@router.options("/api/v1/chatbot/chatting")
async def chatbot_options():
    """
    CORS preflight 요청 처리
    """
    return {"message": "OK"}
