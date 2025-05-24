import requests
import logging
import json

from ..core import settings

url = "https://api.openai.com/v1/chat/completions"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {settings.openai_api_key}"
}

logger = logging.getLogger(__name__)

def get_chatbot_response(contents):
    try:
        # API 요청 데이터 준비
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant."
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
                return "죄송합니다. 응답을 처리하는 데 문제가 발생했습니다."
        else:
            logger.error(f"OpenAI API 응답 형식 오류: 'choices' 키가 없거나 비어 있습니다. 응답: {json.dumps(response_data, ensure_ascii=False)}")
            return "죄송합니다. 응답을 처리하는 데 문제가 발생했습니다."
            
    except requests.exceptions.Timeout:
        logger.error("OpenAI API 타임아웃")
        return "죄송합니다. 응답 시간이 초과되었습니다. 나중에 다시 시도해 주세요."
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenAI API 요청 오류: {str(e)}")
        return "죄송합니다. 서비스에 연결할 수 없습니다. 나중에 다시 시도해 주세요."
    except Exception as e:
        logger.error(f"예상치 못한 오류: {str(e)}")
        return "죄송합니다. 내부 오류가 발생했습니다. 나중에 다시 시도해 주세요."