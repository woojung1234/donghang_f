  parseExpenseFromInput(input, requestDate = false) {
    try {
      console.log('=== parseExpenseFromInput 시작 ===');
      console.log('입력:', input);
      
      const text = input.toLowerCase().trim();
      logger.info('파싱 시도 - 입력 텍스트:', text);
      
      // 5000원, 5,000원, 5천원 등 패턴 감지
      let amount = 0;
      
      // 천원 패턴 (5천원, 5천 원)
      if (text.includes('천')) {
        const match = text.match(/(\d+)\s*천/);
        if (match) {
          amount = parseInt(match[1]) * 1000;
          console.log('천원 패턴 매치:', match[1], '-> ', amount);
        }
      }
      // 만원 패턴 (5만원, 5만 원)
      else if (text.includes('만')) {
        const match = text.match(/(\d+)\s*만/);
        if (match) {
          amount = parseInt(match[1]) * 10000;
          console.log('만원 패턴 매치:', match[1], '-> ', amount);
        }
      }
      // 일반 원 패턴 (5000원, 5,000원)
      else if (text.includes('원')) {
        const match = text.match(/(\d+(?:,\d+)?)\s*원/);
        if (match) {
          amount = parseInt(match[1].replace(/,/g, ''));
          console.log('원 패턴 매치:', match[1], '-> ', amount);
        }
      }
      
      console.log('최종 추출된 금액:', amount);
      
      if (amount === 0) {
        console.log('금액을 찾을 수 없음 - null 반환');
        return null;
      }
      
      // 소비 관련 키워드 확인
      const expenseKeywords = ['먹었', '썼', '샀', '구매', '지불', '결제', '냈', '쇼핑했'];
      const hasExpenseKeyword = expenseKeywords.some(keyword => text.includes(keyword));
      
      console.log('소비 키워드 체크:', hasExpenseKeyword);
      
      if (!hasExpenseKeyword) {
        console.log('소비 키워드가 없음 - null 반환');
        return null;
      }
      
      // 카테고리 추론
      let category = '기타';
      if (text.includes('점심') || text.includes('저녁') || text.includes('아침') || text.includes('먹었')) {
        category = '식비';
      } else if (text.includes('쇼핑') || text.includes('옷') || text.includes('샀')) {
        category = '쇼핑';
      }
      
      const result = {
        amount: amount,
        category: category,
        merchantName: category === '식비' ? '일반음식점' : '일반상점',
        originalText: input,
        transactionDate: null,
        needsDateConfirmation: true
      };
      
      console.log('파싱 성공 결과:', result);
      return result;
      
    } catch (error) {
      console.error('parseExpenseFromInput 오류:', error);
      return null;
    }
  }
