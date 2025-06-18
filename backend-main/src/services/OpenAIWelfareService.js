// backend-main/src/services/OpenAIWelfareService.js

const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIWelfareService {
  constructor() {
    this.openai = null;
    this.apiKey = process.env.OPENAI_API_KEY;
    this.isAvailable = false;
    
    this.initialize();
  }

  initialize() {
    if (this.apiKey && this.apiKey !== 'dummy-key' && this.apiKey.startsWith('sk-')) {
      try {
        this.openai = new OpenAI({
          apiKey: this.apiKey
        });
        this.isAvailable = true;
        logger.info('✅ OpenAI 서비스 초기화 완료');
      } catch (error) {
        logger.error('❌ OpenAI 서비스 초기화 실패:', error.message);
        this.isAvailable = false;
      }
    } else {
      logger.warn('⚠️ OpenAI API 키가 설정되지 않음 - 오프라인 모드로 동작');
      this.isAvailable = false;
    }
  }

  /**
   * 복지서비스 데이터를 기반으로 자연스러운 추천 응답 생성
   * @param {Array} welfareServices - 공공데이터에서 가져온 복지서비스 목록
   * @param {Object} userContext - 사용자 컨텍스트 (나이, 관심사, 원본 질문 등)
   * @returns {string} GPT가 생성한 자연스러운 추천 응답
   */
  async generateWelfareRecommendation(welfareServices, userContext = {}) {
    if (!this.isAvailable) {
      logger.info('OpenAI 서비스 미사용 - 폴백 응답 반환');
      return this.generateFallbackRecommendation(welfareServices, userContext);
    }

    try {
      const prompt = this.buildWelfareRecommendationPrompt(welfareServices, userContext);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `당신은 '금복이'라는 이름의 노인분들을 위한 친절한 AI 도우미입니다. 
            복지서비스를 추천할 때는 다음 원칙을 지켜주세요:
            1. 친근하고 따뜻한 어조로 대화
            2. 복잡한 용어 대신 쉬운 말로 설명
            3. 실제 도움이 되는 구체적인 정보 제공
            4. 연락처나 신청방법을 명확하게 안내
            5. 음성으로 들었을 때 자연스럽도록 작성
            6. 이모지나 특수문자는 사용하지 말고 한글로만 작성`
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content;
      
      if (response) {
        logger.info('✅ GPT 복지서비스 추천 응답 생성 성공');
        return this.cleanResponseForVoice(response);
      } else {
        logger.warn('⚠️ GPT 응답이 비어있음 - 폴백 응답 사용');
        return this.generateFallbackRecommendation(welfareServices, userContext);
      }

    } catch (error) {
      logger.error('❌ GPT 복지서비스 추천 생성 실패:', error.message);
      return this.generateFallbackRecommendation(welfareServices, userContext);
    }
  }

  /**
   * GPT용 프롬프트 생성
   * @param {Array} welfareServices - 복지서비스 목록  
   * @param {Object} userContext - 사용자 컨텍스트
   * @returns {string} 완성된 프롬프트
   */
  buildWelfareRecommendationPrompt(welfareServices, userContext) {
    const { originalQuestion = '', interests = [], age = 65, region = '서울' } = userContext;
    
    let prompt = `사용자가 "${originalQuestion}"라고 질문했습니다.\n\n`;
    
    prompt += `사용자 정보:\n`;
    prompt += `- 나이: ${age}세\n`;
    prompt += `- 지역: ${region}\n`;
    if (interests.length > 0) {
      prompt += `- 관심분야: ${interests.join(', ')}\n`;
    }
    prompt += `\n`;

    prompt += `다음은 공공데이터에서 가져온 실제 복지서비스 목록입니다:\n\n`;
    
    welfareServices.slice(0, 5).forEach((service, index) => {
      prompt += `${index + 1}. **${service.serviceName}**\n`;
      if (service.serviceSummary) {
        prompt += `   - 내용: ${service.serviceSummary}\n`;
      }
      if (service.targetAudience) {
        prompt += `   - 대상: ${service.targetAudience}\n`;
      }
      if (service.applicationMethod) {
        prompt += `   - 신청방법: ${service.applicationMethod}\n`;
      }
      if (service.organizationName) {
        prompt += `   - 담당기관: ${service.organizationName}\n`;
      }
      if (service.contactInfo) {
        prompt += `   - 문의: ${service.contactInfo}\n`;
      }
      prompt += `\n`;
    });

    prompt += `위 복지서비스들을 바탕으로 사용자에게 도움이 될 만한 서비스 2-3개를 선별해서 자연스럽고 친근하게 추천해주세요. `;
    prompt += `각 서비스의 핵심 내용과 연락처를 포함하되, 음성으로 들었을 때 이해하기 쉽도록 설명해주세요. `;
    prompt += `마지막에는 더 자세한 정보를 원하면 "자세히 알려줘"라고 말씀하라고 안내해주세요.`;

    return prompt;
  }

  /**
   * 음성 변환을 위한 응답 정제
   * @param {string} response - GPT 원본 응답
   * @returns {string} 정제된 응답
   */
  cleanResponseForVoice(response) {
    return response
      .replace(/\*\*([^*]+)\*\*/g, '$1') // **굵은글씨** 제거
      .replace(/\*([^*]+)\*/g, '$1')     // *기울임* 제거
      .replace(/#{1,6}\s*/g, '')        // # 헤더 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [링크](url) -> 링크텍스트만
      .replace(/[📞🏥💬📋🌐]/g, '')      // 이모지 제거
      .replace(/\n{3,}/g, '\n\n')       // 과도한 줄바꿈 정리
      .trim();
  }

  /**
   * 복지서비스 상세 정보 설명 생성
   * @param {Array} welfareServices - 복지서비스 목록
   * @param {Object} userContext - 사용자 컨텍스트
   * @returns {string} 상세 설명 응답
   */
  async generateDetailedWelfareInfo(welfareServices, userContext = {}) {
    if (!this.isAvailable) {
      return this.generateFallbackDetailedInfo(welfareServices);
    }

    try {
      const prompt = `다음 복지서비스들에 대해 노인분이 이해하기 쉽도록 상세하게 설명해주세요:\n\n`;
      
      let serviceInfo = '';
      welfareServices.forEach((service, index) => {
        serviceInfo += `${index + 1}. ${service.serviceName}\n`;
        serviceInfo += `내용: ${service.serviceSummary || '정보없음'}\n`;
        serviceInfo += `대상: ${service.targetAudience || '정보없음'}\n`;
        serviceInfo += `신청방법: ${service.applicationMethod || '정보없음'}\n`;
        serviceInfo += `담당기관: ${service.organizationName || '정보없음'}\n`;
        serviceInfo += `문의: ${service.contactInfo || '정보없음'}\n\n`;
      });

      const fullPrompt = prompt + serviceInfo + 
        '\n각 서비스별로 구체적으로 어떤 도움을 받을 수 있는지, 어떻게 신청하는지 쉽게 설명해주세요.';

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 노인분들을 위한 친절한 복지서비스 안내원입니다. 복잡한 정보를 쉽고 친근하게 설명해주세요."
          },
          {
            role: "user",
            content: fullPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content;
      return response ? this.cleanResponseForVoice(response) : this.generateFallbackDetailedInfo(welfareServices);

    } catch (error) {
      logger.error('❌ GPT 상세 정보 생성 실패:', error.message);
      return this.generateFallbackDetailedInfo(welfareServices);
    }
  }

  /**
   * OpenAI 사용 불가 시 폴백 응답 생성
   * @param {Array} welfareServices - 복지서비스 목록
   * @param {Object} userContext - 사용자 컨텍스트  
   * @returns {string} 폴백 응답
   */
  generateFallbackRecommendation(welfareServices, userContext = {}) {
    if (!welfareServices || welfareServices.length === 0) {
      return this.getDefaultActivityRecommendation();
    }

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const today = new Date();
    const todayName = dayNames[today.getDay()];

    let response = `안녕하세요! 오늘 ${todayName}에는 이런 복지서비스들이 도움이 될 것 같아요.\n\n`;

    // 상위 2-3개 서비스 추천
    const topServices = welfareServices.slice(0, 3);
    
    topServices.forEach((service, index) => {
      response += `${index + 1}. ${service.serviceName}\n`;
      
      if (service.serviceSummary) {
        const summary = service.serviceSummary.length > 80 
          ? service.serviceSummary.substring(0, 80) + '...'
          : service.serviceSummary;
        response += `${summary}\n`;
      }
      
      if (service.contactInfo && service.contactInfo !== '정보없음') {
        response += `문의: ${service.contactInfo}\n`;
      }
      
      response += '\n';
    });

    response += '더 자세한 정보가 필요하시면 "자세히 알려줘"라고 말씀해주세요!';
    
    return response;
  }

  /**
   * 상세 정보 폴백 응답 생성
   * @param {Array} welfareServices - 복지서비스 목록
   * @returns {string} 상세 정보 폴백 응답
   */
  generateFallbackDetailedInfo(welfareServices) {
    if (!welfareServices || welfareServices.length === 0) {
      return '죄송합니다. 상세 정보를 가져올 수 없습니다.';
    }

    let response = '복지서비스 상세 정보를 알려드릴게요.\n\n';

    welfareServices.forEach((service, index) => {
      response += `${index + 1}. ${service.serviceName}\n`;
      
      if (service.serviceSummary) {
        response += `서비스 내용: ${service.serviceSummary}\n`;
      }
      
      if (service.targetAudience) {
        response += `대상: ${service.targetAudience}\n`;
      }
      
      if (service.applicationMethod) {
        response += `신청방법: ${service.applicationMethod}\n`;
      }
      
      if (service.organizationName) {
        response += `담당기관: ${service.organizationName}\n`;
      }
      
      if (service.contactInfo) {
        response += `문의: ${service.contactInfo}\n`;
      }
      
      response += '\n';
    });

    response += '더 많은 복지서비스는 복지서비스 메뉴에서 확인하세요!';
    
    return response;
  }

  /**
   * 기본 활동 추천 (데이터가 없을 때)
   * @returns {string} 기본 활동 추천 응답
   */
  getDefaultActivityRecommendation() {
    const activities = [
      {
        name: '건강한 산책',
        description: '날씨가 좋으니 근처 공원에서 가벼운 산책은 어떠세요? 신선한 공기를 마시며 건강도 챙기실 수 있어요.'
      },
      {
        name: '독서 시간', 
        description: '좋아하는 책을 읽으며 여유로운 시간을 보내보세요. 도서관에서 새로운 책을 빌려보시는 것도 좋겠어요.'
      },
      {
        name: '가벼운 체조',
        description: '집에서 할 수 있는 간단한 스트레칭으로 몸을 풀어보세요. TV 체조 프로그램을 따라해보시는 것도 좋아요.'
      },
      {
        name: '가족과의 시간',
        description: '가족들과 안부 전화를 나누며 따뜻한 시간을 보내세요. 손자손녀들 목소리를 들으면 기분이 좋아지실 거예요.'
      }
    ];

    const selected = activities[Math.floor(Math.random() * activities.length)];
    
    return `오늘은 ${selected.name}는 어떠세요?\n\n${selected.description}\n\n복지서비스 페이지에서 더 많은 프로그램을 확인하실 수 있어요!`;
  }

  /**
   * API 상태 확인
   * @returns {boolean} 사용 가능 여부
   */
  checkAvailability() {
    return this.isAvailable;
  }
}

module.exports = new OpenAIWelfareService();