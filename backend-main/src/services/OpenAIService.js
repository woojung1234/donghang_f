// OpenAI API 서비스 클래스
const axios = require('axios');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!this.apiKey) {
      logger.warn('OpenAI API 키가 설정되지 않았습니다. 하드코딩 응답을 사용합니다.');
    }
  }

  // GPT API 사용 가능 여부 체크
  isAvailable() {
    return !!this.apiKey && this.apiKey !== 'your-openai-api-key-here';
  }

  // 시스템 프롬프트 정의
  getSystemPrompt() {
    return `당신은 '금복이'라는 이름의 친근하고 도움이 되는 AI 어시스턴트입니다.

주요 역할:
1. 🏦 가계부 관리 도우미 - 소비내역 기록, 분석, 조회
2. 🏥 복지서비스 안내 - 복지서비스 추천, 예약 도움  
3. 💬 친근한 대화 상대 - 자연스럽고 따뜻한 대화

응답 스타일:
- 친근하고 따뜻한 말투 사용
- 간결하고 명확한 설명
- 이모지는 적당히 사용 (음성 전환 시 읽히지 않도록)
- 존댓말 사용
- 실용적이고 도움이 되는 조언 제공

주의사항:
- 금융, 의료, 법률 등 전문적 조언은 전문가 상담 권유
- 개인정보 보호 철저히 준수
- 확실하지 않은 정보는 "정확하지 않을 수 있다" 언급

당신은 사용자의 일상을 더 편리하고 풍요롭게 만드는 것이 목표입니다.`;
  }

  // 대화 맥락을 고려한 프롬프트 생성
  buildPrompt(userMessage, context = {}) {
    let prompt = '';
    
    // 이전 대화 맥락이 있으면 추가
    if (context.previousMessages && context.previousMessages.length > 0) {
      prompt += '이전 대화 내용:\n';
      context.previousMessages.slice(-3).forEach(msg => {
        prompt += `${msg.role === 'user' ? '사용자' : '금복이'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    // 현재 기능 분석 결과가 있으면 추가
    if (context.detectedFeature) {
      prompt += `감지된 기능: ${context.detectedFeature}\n`;
    }
    
    // 사용자 데이터가 있으면 추가
    if (context.userData) {
      prompt += `관련 데이터: ${JSON.stringify(context.userData, null, 2)}\n`;
    }
    
    // 기능별 특수 프롬프트
    if (context.featurePrompt) {
      prompt += `\n상황: ${context.featurePrompt}\n`;
    }
    
    prompt += `\n현재 사용자 메시지: "${userMessage}"\n\n`;
    prompt += '위 내용을 바탕으로 자연스럽고 도움이 되는 응답을 해주세요.';
    
    return prompt;
  }

  // GPT API 호출
  async generateResponse(userMessage, context = {}) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API가 사용 불가능합니다.');
    }

    try {
      logger.info('🤖 GPT API 호출 시작:', { userMessage: userMessage.substring(0, 50) });
      
      const messages = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user', 
          content: this.buildPrompt(userMessage, context)
        }
      ];

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices[0].message.content.trim();
      logger.info('✅ GPT 응답 생성 완료:', { 
        response: aiResponse.substring(0, 100),
        tokens: response.data.usage 
      });
      
      return aiResponse;

    } catch (error) {
      logger.error('❌ GPT API 호출 실패:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('API 사용량 한도 초과. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.status === 401) {
        throw new Error('OpenAI API 키가 유효하지 않습니다.');
      } else {
        throw new Error('AI 서비스에 일시적인 문제가 있습니다. 다시 시도해주세요.');
      }
    }
  }

  // 특정 기능에 대한 맞춤형 응답 생성
  async generateFeatureResponse(feature, userMessage, data = null) {
    const context = {
      detectedFeature: feature,
      userData: data
    };

    let enhancedPrompt = '';
    
    switch (feature) {
      case 'expense_inquiry':
        enhancedPrompt = `사용자가 소비내역 조회를 요청했습니다. 
        조회 결과: ${data ? JSON.stringify(data, null, 2) : '데이터 없음'}
        
        이 정보를 바탕으로 사용자에게 친근하고 유용한 소비내역 분석을 제공해주세요.`;
        break;
        
      case 'expense_saved':
        enhancedPrompt = `사용자가 소비내역을 등록했습니다.
        등록된 정보: ${data ? JSON.stringify(data, null, 2) : '등록 완료'}
        
        등록 완료를 알리고 격려하는 메시지를 작성해주세요.`;
        break;
        
      case 'welfare_recommendation':
        enhancedPrompt = `사용자가 복지서비스 추천을 요청했습니다.
        추천 서비스: ${data ? JSON.stringify(data, null, 2) : '추천 서비스 목록'}
        
        이 복지서비스들을 자연스럽게 소개하고 추천해주세요.`;
        break;
        
      case 'greeting':
        enhancedPrompt = `사용자가 인사를 했습니다. 금복이답게 친근하고 따뜻한 인사를 해주세요.`;
        break;
        
      case 'general':
        enhancedPrompt = `일반적인 대화입니다. 금복이의 성격을 유지하며 도움이 되는 응답을 해주세요.`;
        break;
        
      default:
        enhancedPrompt = `사용자 요청: ${userMessage}`;
    }
    
    return await this.generateResponse(userMessage, {
      ...context,
      featurePrompt: enhancedPrompt
    });
  }

  // 응답에서 이모지 제거 (음성 합성용)
  removeEmojisForVoice(text) {
    // 이모지 제거 정규식
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }

  // 간단한 응답 생성 (빠른 응답용)
  async generateSimpleResponse(message, fallbackResponse) {
    try {
      if (!this.isAvailable()) {
        return fallbackResponse;
      }
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '당신은 금복이입니다. 간단하고 친근하게 한 문장으로 응답해주세요.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 100,
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      logger.error('간단 응답 생성 실패:', error.message);
      return fallbackResponse;
    }
  }
}

module.exports = new OpenAIService();
