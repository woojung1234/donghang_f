    // 이름/정체성 질문
    if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      const responses = [
        "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!",
        "금복이예요! 여러분의 가계 관리와 복지 생활을 도와드리는 AI 도우미입니다!",
        "안녕하세요, 저는 금복이에요! 돈 관리와 복지서비스가 저의 전문 분야랍니다!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } 
    
    // 도움 요청
    if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘") || lowercaseMessage.includes("도와주세요")) {
      const responses = [
        "네, 어떤 도움이 필요하신가요? 가계부 기록이나 복지서비스 추천을 도와드릴 수 있어요!",
        "물론이죠! 소비 내역 기록, 가계부 관리, 복지서비스 안내 등 무엇이든 말씀해주세요!",
        "도움이 필요하시군요! 구체적으로 어떤 것을 도와드릴까요? 가계부? 복지서비스? 아니면 다른 것?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 기능/할 수 있는 일 질문
    if ((lowercaseMessage.includes('뭘') && (lowercaseMessage.includes('할수') || lowercaseMessage.includes('할 수'))) || 
        lowercaseMessage.includes('무엇') || (lowercaseMessage.includes('어떤') && lowercaseMessage.includes('기능'))) {
      const responses = [
        "제가 할 수 있는 일들을 소개해드릴게요! 가계부 자동 기록, 소비 내역 분석, 복지서비스 추천, 활동 제안 등이 가능해요!",
        "다양한 것들을 도와드릴 수 있어요! '3만원 마트에서 썼어' 하면 가계부에 기록하고, '오늘 뭐할까?' 하면 복지서비스를 추천해드려요!",
        "음성으로 쉽게 가계부를 관리하고, 맞춤형 복지서비스도 추천해드릴 수 있어요! 또 소비 패턴 분석도 가능하답니다!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 감사 인사
    if (lowercaseMessage.includes("고마") || lowercaseMessage.includes("감사")) {
      const responses = [
        "천만에요! 언제든 도움이 필요하시면 말씀해주세요!",
        "별말씀을요! 더 궁금한 것이 있으시면 언제든 물어보세요!",
        "도움이 되었다니 다행이에요! 또 필요한 것이 있으시면 말씀해주세요!",
        "기쁘게 도와드렸어요! 앞으로도 언제든 불러주세요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 기분/안부 질문
    if (lowercaseMessage.includes("기분") || lowercaseMessage.includes("어때") || lowercaseMessage.includes("잘지내")) {
      const responses = [
        "저는 항상 좋아요! 여러분을 도와드릴 수 있어서 기분이 좋답니다!",
        "덕분에 잘 지내고 있어요! 오늘 하루는 어떠셨나요?",
        "매일매일 열심히 일하고 있어요! 무엇을 도와드릴까요?",
        "기분 좋게 지내고 있어요! 여러분이 행복하시면 저도 행복해요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 날씨 관련
    if (lowercaseMessage.includes("날씨")) {
      const responses = [
        "날씨 정보는 직접 제공해드릴 수 없지만, 날씨가 좋으면 산책이나 야외 활동을 추천해드릴 수 있어요! '오늘 뭐할까?'라고 물어보시면 복지서비스도 추천해드려요!",
        "날씨에 관해서는 잘 모르지만, 실내외 활동 추천은 가능해요! 어떤 활동을 원하시는지 말씀해주세요!",
        "직접적인 날씨 정보는 어렵지만, 날씨에 맞는 활동이나 복지서비스는 추천해드릴 수 있어요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 소비/돈 관련 일반적인 언급
    if (lowercaseMessage.includes("돈") || lowercaseMessage.includes("소비") || lowercaseMessage.includes("지출")) {
      const responses = [
        "돈 관리가 고민이시군요! 구체적으로 어떤 도움이 필요하신가요? 가계부 기록이나 소비 분석을 도와드릴 수 있어요!",
        "소비 관리에 관심이 있으시군요! '얼마 어디서 썼다'고 말씀해주시면 자동으로 기록해드려요!",
        "가계 관리가 필요하시군요! 음성으로 간편하게 소비 내역을 기록하고 분석해드릴 수 있어요!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 복지 관련 일반적인 언급
    if (lowercaseMessage.includes("복지") || lowercaseMessage.includes("서비스")) {
      const responses = [
        "복지서비스에 관심이 있으시군요! '오늘 뭐할까?' 또는 '복지서비스 추천해줘'라고 말씀해주시면 맞춤형 서비스를 추천해드려요!",
        "복지서비스 정보가 필요하시군요! 어떤 분야의 서비스를 원하시는지 구체적으로 말씀해주세요!",
        "다양한 복지서비스를 안내해드릴 수 있어요! 건강, 문화, 교육, 돌봄 등 어떤 분야가 궁금하신가요?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 일반적인 질문이나 알 수 없는 내용
    const generalResponses = [
      "네, 말씀해주세요! 어떤 것을 도와드릴까요?",
      "궁금한 것이 있으시면 언제든 말씀해주세요!",
      "더 자세히 말씀해주시면 도움을 드릴 수 있을 것 같아요!",
      "무엇이든 편하게 말씀해주세요!",
      "어떤 도움이 필요하신지 알려주시면 최선을 다해 도와드릴게요!",
      "잘 이해하지 못했어요. 조금 더 구체적으로 말씀해주실 수 있나요?",
      "흥미로운 말씀이네요! 어떤 도움을 원하시는 건가요?",
      "네, 듣고 있어요! 더 자세히 설명해주시면 좋겠어요!"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  getOfflineResponse(message) {
    if (!message) return this.fallbackResponses[0];

    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('가계부')) {
      return '가계부 기능이 궁금하시군요! "5000원 점심 먹었어" 이런 식으로 말씀해주시면 자동으로 가계부에 기록해드려요 📝';
    }
    
    if (lowercaseMessage.includes("안녕") || lowercaseMessage.includes("반가")) {
      return "안녕하세요! 무엇을 도와드릴까요? 소비 내역을 말씀해주시거나 '오늘 뭐할까?'라고 물어보시면 복지서비스를 추천해드려요! 💰";
    } else if (lowercaseMessage.includes("이름") || lowercaseMessage.includes("누구")) {
      return "저는 금복이라고 합니다. 가계부 관리와 복지서비스 추천을 도와드릴 수 있어요!";
    } else if (lowercaseMessage.includes("도움") || lowercaseMessage.includes("도와줘")) {
      return "네, 어떤 도움이 필요하신가요? 가계부 기록이나 복지서비스 추천을 도와드릴 수 있어요!";
    }
    
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }
}

module.exports = new AIChatService();
