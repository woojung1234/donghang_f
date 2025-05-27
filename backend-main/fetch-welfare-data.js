const axios = require('axios');
const Welfare = require('./src/models/Welfare');
const { sequelize } = require('./src/models');
require('dotenv').config();

async function fetchAndSaveWelfareData() {
  try {
    console.log('🚀 공공 API에서 복지서비스 데이터 가져오기 시작...');
    
    const apiKey = process.env.PUBLIC_DATA_API_KEY;
    if (!apiKey) {
      throw new Error('PUBLIC_DATA_API_KEY가 설정되지 않았습니다.');
    }

    console.log('🔑 API 키 확인됨');

    // 기존 데이터 개수 확인
    const existingCount = await Welfare.count();
    console.log(`📊 현재 DB에 있는 복지서비스 개수: ${existingCount}`);

    let totalAdded = 0;

    // 공공데이터포털 복지서비스 API들 시도
    const apiUrls = [
      // 1. 사회보장급여 제공(공급) 기관 API
      `https://apis.data.go.kr/1383000/gmis/serviceList?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=100&dataType=json`,
      
      // 2. 한국사회보장정보원 복지서비스 API
      `https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/getWelfareInfoList?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=100&dataType=json`,
      
      // 3. 사회보장급여 시설 정보 API  
      `https://apis.data.go.kr/1383000/nsis/sisList?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=100&dataType=json`
    ];

    for (let i = 0; i < apiUrls.length; i++) {
      try {
        console.log(`📡 API ${i+1} 호출 중...`);
        
        const response = await axios.get(apiUrls[i], { 
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log(`📡 API ${i+1} 응답 상태:`, response.status);
        
        if (response.data) {
          const responseData = response.data;
          console.log(`📄 API ${i+1} 응답 구조:`, Object.keys(responseData));
          
          // 다양한 응답 구조에 대응
          let items = [];
          if (responseData.response?.body?.items) {
            items = Array.isArray(responseData.response.body.items) 
              ? responseData.response.body.items 
              : [responseData.response.body.items];
          } else if (responseData.items) {
            items = Array.isArray(responseData.items) ? responseData.items : [responseData.items];
          } else if (responseData.data) {
            items = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
          }

          console.log(`📋 API ${i+1}에서 가져온 항목 수: ${items.length}`);

          for (const item of items) {
            if (item && (item.servNm || item.serviceName || item.svcNm || item.instNm)) {
              try {
                const serviceId = item.servId || item.serviceId || item.svcId || item.instId || `API${i+1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const serviceName = item.servNm || item.serviceName || item.svcNm || item.instNm || '복지서비스';
                const serviceSummary = item.servDtlLink || item.serviceDesc || item.svcCn || item.instAddr || '복지서비스 정보';
                const ministryName = item.minisNm || item.ministry || '보건복지부';
                const organizationName = item.orgNm || item.organization || item.instNm || '관련기관';
                const contactInfo = item.telno || item.contact || item.phoneNumber || '';
                const targetAudience = item.servTrgt || item.target || item.lifeNm || '일반';
                const applicationMethod = item.aplyMthd || item.method || '방문 또는 온라인 신청';
                const category = item.lifeNm || item.category || item.servDtlNm || this.getCategoryFromService(serviceName);

                // 중복 확인
                const existing = await Welfare.findOne({
                  where: { serviceId: serviceId }
                });

                if (!existing) {
                  await Welfare.create({
                    serviceId: serviceId,
                    serviceName: serviceName,
                    serviceSummary: serviceSummary.length > 500 ? serviceSummary.substring(0, 500) + '...' : serviceSummary,
                    ministryName: ministryName,
                    organizationName: organizationName,
                    contactInfo: contactInfo,
                    website: '',
                    serviceUrl: '',
                    referenceYear: '2024',
                    lastModifiedDate: new Date().toISOString().split('T')[0],
                    targetAudience: targetAudience,
                    applicationMethod: applicationMethod,
                    category: category,
                    isActive: true
                  });
                  
                  totalAdded++;
                  console.log(`✅ 추가됨: ${serviceName}`);
                }
              } catch (itemError) {
                console.error(`❌ 항목 저장 실패:`, itemError.message);
              }
            }
          }
        }
      } catch (apiError) {
        console.log(`❌ API ${i+1} 호출 실패:`, apiError.message);
      }
    }

    // 기본 샘플 데이터라도 추가 (API 호출이 모두 실패한 경우)
    if (totalAdded === 0) {
      console.log('📝 API 호출이 실패하여 기본 샘플 데이터 추가...');
      
      const sampleData = [
        {
          serviceId: 'SAMPLE_001',
          serviceName: '기초연금',
          serviceSummary: '만 65세 이상 어르신 중 소득인정액이 선정기준액 이하인 분께 매월 기초연금을 지급하는 제도입니다.',
          ministryName: '보건복지부',
          organizationName: '국민연금공단',
          contactInfo: '국민연금공단 콜센터 1355',
          targetAudience: '만 65세 이상, 소득인정액 기준 하위 70%',
          applicationMethod: '온라인 신청, 방문신청, 우편신청',
          category: '노인복지'
        },
        {
          serviceId: 'SAMPLE_002', 
          serviceName: '노인돌봄종합서비스',
          serviceSummary: '신체적·정신적 기능저하로 돌봄이 필요한 노인에게 가사·활동지원, 주간보호, 단기보호 등 종합적인 서비스를 제공합니다.',
          ministryName: '보건복지부',
          organizationName: '지방자치단체',
          contactInfo: '거주지 읍면동 주민센터',
          targetAudience: '65세 이상 노인 중 장기요양등급외자',
          applicationMethod: '읍면동 주민센터 방문신청',
          category: '노인복지'
        },
        {
          serviceId: 'SAMPLE_003',
          serviceName: '장애인활동지원서비스',
          serviceSummary: '신체적·정신적 장애 등으로 혼자서 일상생활과 사회생활을 하기 어려운 장애인에게 활동지원서비스를 제공합니다.',
          ministryName: '보건복지부',
          organizationName: '국민건강보험공단',
          contactInfo: '국민건강보험공단 1577-1000',
          targetAudience: '만 6세 이상 ~ 만 65세 미만 장애인',
          applicationMethod: '국민건강보험공단 지사 방문신청',
          category: '장애인복지'
        },
        {
          serviceId: 'SAMPLE_004',
          serviceName: '아동수당',
          serviceSummary: '0~95개월(만 8세 미만) 아동에게 월 10만원의 아동수당을 지급하여 아동양육에 따른 경제적 부담을 경감하는 제도입니다.',
          ministryName: '보건복지부',
          organizationName: '지방자치단체',  
          contactInfo: '거주지 읍면동 주민센터',
          targetAudience: '0~95개월(만 8세 미만) 아동',
          applicationMethod: '온라인 신청, 방문신청',
          category: '아동복지'
        },
        {
          serviceId: 'SAMPLE_005',
          serviceName: '문화누리카드',
          serviceSummary: '기초생활수급자, 차상위계층을 대상으로 문화활동을 지원하는 카드로 도서, 영화, 공연 등에 사용할 수 있습니다.',
          ministryName: '문화체육관광부',
          organizationName: '한국문화예술회관연합회',
          contactInfo: '문화누리 고객센터 1544-3412',
          targetAudience: '기초생활수급자, 차상위계층',
          applicationMethod: '온라인 신청, 방문신청',
          category: '문화복지'
        }
      ];

      for (const data of sampleData) {
        await Welfare.create({
          ...data,
          website: '',
          serviceUrl: '',
          referenceYear: '2024',
          lastModifiedDate: new Date().toISOString().split('T')[0],
          isActive: true
        });
        totalAdded++;
        console.log(`✅ 샘플 추가됨: ${data.serviceName}`);
      }
    }

    console.log(`🎉 복지서비스 데이터 저장 완료! 총 ${totalAdded}개 추가됨`);
    
    // 최종 확인
    const finalCount = await Welfare.count();
    console.log(`📊 최종 DB 복지서비스 개수: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ 복지서비스 데이터 저장 오류:', error);
  } finally {
    await sequelize.close();
  }
}

// 서비스명으로 카테고리 추론하는 헬퍼 함수
function getCategoryFromService(serviceName) {
  if (!serviceName) return '기타';
  
  const name = serviceName.toLowerCase();
  
  if (name.includes('노인') || name.includes('어르신') || name.includes('연금')) return '노인복지';
  if (name.includes('아동') || name.includes('육아') || name.includes('보육')) return '아동복지';
  if (name.includes('장애') || name.includes('장애인')) return '장애인복지';
  if (name.includes('문화') || name.includes('예술') || name.includes('체육')) return '문화복지';
  if (name.includes('교육') || name.includes('학습')) return '교육복지';
  if (name.includes('의료') || name.includes('건강') || name.includes('치료')) return '의료복지';
  if (name.includes('취업') || name.includes('고용') || name.includes('일자리')) return '고용복지';
  if (name.includes('주거') || name.includes('임대') || name.includes('주택')) return '주거복지';
  
  return '기타';
}

// 스크립트 실행
if (require.main === module) {
  fetchAndSaveWelfareData()
    .then(() => {
      console.log('✅ 작업 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = fetchAndSaveWelfareData;