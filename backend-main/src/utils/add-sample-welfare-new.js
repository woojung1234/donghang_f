const { sequelize } = require('../models');
const Welfare = require('../models/Welfare');

async function addSampleWelfareData() {
  try {
    console.log('🔄 복지 서비스 샘플 데이터 추가 시작...');
    
    // 기존 데이터 확인
    const existingCount = await Welfare.count();
    
    if (existingCount > 0) {
      console.log('✅ 이미 복지 서비스 데이터가 존재합니다.');
      return;
    }
    
    // 샘플 데이터 추가
    const sampleData = [
      {
        welfareNo: 1,
        welfareName: '기초연금',
        welfareCategory: '노인',
        welfarePrice: 0,
        welfareDescription: '만 65세 이상 어르신 중 소득인정액이 선정기준액 이하인 분께 매월 기초연금을 지급하는 제도입니다.'
      },
      {
        welfareNo: 2,
        welfareName: '노인돌봄종합서비스',
        welfareCategory: '노인',
        welfarePrice: 150000,
        welfareDescription: '신체적·정신적 기능저하로 돌봄이 필요한 노인에게 가사·활동지원, 주간보호, 단기보호 등 종합적인 서비스를 제공합니다.'
      },
      {
        welfareNo: 3,
        welfareName: '아동수당',
        welfareCategory: '아동',
        welfarePrice: 0,
        welfareDescription: '0~95개월(만 8세 미만) 아동에게 월 10만원의 아동수당을 지급하여 아동양육에 따른 경제적 부담을 경감하는 제도입니다.'
      },
      {
        welfareNo: 4,
        welfareName: '어르신 건강체조 프로그램',
        welfareCategory: '건강/의료',
        welfarePrice: 0,
        welfareDescription: '어르신들의 건강한 생활을 위한 체조 프로그램입니다.'
      },
      {
        welfareNo: 5,
        welfareName: '실버 문화교실',
        welfareCategory: '문화/교육',
        welfarePrice: 5000,
        welfareDescription: '어르신들을 위한 다양한 문화 활동 프로그램입니다.'
      },
      {
        welfareNo: 6,
        welfareName: '독거노인 안전지원서비스',
        welfareCategory: '노인',
        welfarePrice: 0,
        welfareDescription: '독거노인의 안전한 생활을 위한 지원 서비스입니다.'
      },
      {
        welfareNo: 7,
        welfareName: '치매가족 휴가지원',
        welfareCategory: '건강/의료',
        welfarePrice: 100000,
        welfareDescription: '치매 환자 가족의 휴가를 위한 지원 서비스입니다.'
      },
      {
        welfareNo: 8,
        welfareName: '시니어 일자리 지원',
        welfareCategory: '취업/창업',
        welfarePrice: 0,
        welfareDescription: '60세 이상 어르신을 위한 일자리 지원 프로그램입니다.'
      }
    ];
    
    // 데이터 일괄 삽입
    await Welfare.bulkCreate(sampleData, {
      ignoreDuplicates: true
    });
    
    console.log('✅ 복지 서비스 샘플 데이터 추가 완료!');
    
    // 확인
    const finalCount = await Welfare.count();
    console.log(`📊 총 복지 서비스 개수: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ 샘플 데이터 추가 오류:', error);
    throw error;
  }
}

// 스크립트로 직접 실행할 때
if (require.main === module) {
  addSampleWelfareData()
    .then(() => {
      console.log('샘플 데이터 추가 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('샘플 데이터 추가 실패:', error);
      process.exit(1);
    });
}

module.exports = addSampleWelfareData;
