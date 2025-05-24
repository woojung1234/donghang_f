// AI 서비스에 API 요청하는 함수
async function callAIService(message) {
  try {
    // 환경 변수에서 AI 서비스 URL 가져오기 (8000 포트로 수정)
    const AI_SERVICE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';
    const url = `${AI_SERVICE_URL}/api/v1/chatbot/chatting?contents=${encodeURIComponent(message)}`;
    
    console.log("AI 서비스 요청 URL:", url);
    
    // API 요청
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 타임아웃 설정 (5초)
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`AI 서비스 응답 오류: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("AI 서비스 호출 오류:", error);
    // 오류 발생 시 오프라인 응답 사용
    return getOfflineResponse(message);
  }
}