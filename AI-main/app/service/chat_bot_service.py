import requests
import logging
import json
import random
from typing import List

from ..core.setting import settings

url = "https://api.openai.com/v1/chat/completions"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {settings.openai_api_key}"
}

logger = logging.getLogger(__name__)

# 오프라인 모드용 응답
OFFLINE_RESPONSES: List[str] = [
    "안녕하세요! 무엇을 도와드릴까요?",
    "도움이 필요하신가요?",
    "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요.",
    "네, 말씀해보세요.",
    "제가 어떻게 도와드릴까요?",
    "궁금한 점이 있으신가요?",
    "동행 서비스를 이용해 주셔서 감사합니다.",
    "무엇이든 물어보세요!",
    "도와드릴 일이 있으면 말씀해주세요."
]

def get_offline_response(contents: str) -> str:
    """오프라인 모드에서 간단한 응답을 생성합니다."""
    if not contents:
        return OFFLINE_RESPONSES[0]
    
    try:
        # 간단한 키워드 매칭
        contents_lower = contents.lower()
        
        if "안녕" in contents_lower or "반가" in contents_lower:
            return "안녕하세요! 무엇을 도와드릴까요?"
        
        if "이름" in contents_lower or "누구" in contents_lower:
            return "저는 동행 서비스의 AI 도우미 '똑똑'입니다. 무엇을 도와드릴까요?"
            
        if "도움" in contents_lower or "도와" in contents_lower:
            return "네, 어떤 도움이 필요하신가요? 더 자세히 말씀해주세요."
            
        if "시간" in contents_lower or "날짜" in contents_lower or "몇 시" in contents_lower:
            from datetime import datetime
            now = datetime.now()
            return f"현재 시간은 {now.strftime('%Y년 %m월 %d일 %H시 %M분')}입니다."
            
        if "감사" in contents_lower or "고마" in contents_lower:
            return "천만에요! 더 필요한 것이 있으면 말씀해주세요."
            
        # 랜덤 응답
        return random.choice(OFFLINE_RESPONSES)
    except Exception as e:
        logger.error(f"오프라인 응답 생성 오류: {str(e)}")
        return "죄송합니다. 내부 오류가 발생했습니다. 나중에 다시 시도해 주세요."

def get_chatbot_response(contents: str) -> str:
    """
    챗봇 응답을 생성합니다.
    오프라인 모드이거나 API 키가 없으면 로컬 응답을 생성합니다.
    """
    # 오프라인 모드 확인
    if settings.offline_mode or settings.openai_api_key == "dummy-key":
        logger.info("오프라인 모드에서 응답 생성")
        return get_offline_response(contents)
    
    # 온라인 모드 (OpenAI API 사용)
    try:
        # API 요청 데이터 준비
        data = {
            "model": settings.default_model,
            "messages": [
                {
                    "role": "system",
                    "content": settings.system_prompt
                },
                {
                    "role": "user",
                    "content": contents
                }
            ]
        }
        
        # 로깅
        logger.info(f"OpenAI API 요청: {contents}")
        
        # API 호출
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        # 응답 상태 확인
        if not response.ok:
            logger.error(f"OpenAI API 오류: 상태 코드 {response.status_code}, 응답: {response.text}")
            return f"죄송합니다. 응답을 생성하는 데 문제가 발생했습니다. (오류 코드: {response.status_code})"
        
        # 응답 파싱
        response_data = response.json()
        
        # 로깅
        logger.info(f"OpenAI API 응답: {json.dumps(response_data, ensure_ascii=False)[:200]}...")
        
        # 응답 데이터 확인 및 안전하게 처리
        if 'choices' in response_data and len(response_data['choices']) > 0:
            if 'message' in response_data['choices'][0] and 'content' in response_data['choices'][0]['message']:
                message = response_data['choices'][0]['message']['content']
                return message
            else:
                logger.error("OpenAI API 응답 형식 오류: choices[0].message.content가 없습니다.")
                return get_offline_response(contents)
        else:
            logger.error(f"OpenAI API 응답 형식 오류: 'choices' 키가 없거나 비어 있습니다. 응답: {json.dumps(response_data, ensure_ascii=False)}")
            return get_offline_response(contents)
            
    except requests.exceptions.Timeout:
        logger.error("OpenAI API 타임아웃")
        return get_offline_response(contents)
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenAI API 요청 오류: {str(e)}")
        return get_offline_response(contents)
    except Exception as e:
        logger.error(f"예상치 못한 오류: {str(e)}")
        return get_offline_response(contents)