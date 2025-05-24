const { sequelize } = require('../models');

async function addSampleWelfareData() {
  try {
    console.log('🔄 복지 서비스 샘플 데이터 추가 시작...');
    
    // 기존 데이터 확인
    const [countResult] = await sequelize.query('SELECT COUNT(*) as count FROM welfare_services');
    
    if (countResult.count > 0) {
      console.log('✅ 이미 복지 서비스 데이터가 존재합니다.');
      return;
    }
    
    // 샘플 데이터 추가
    const sampleData = [
      [
        'WF001',
        '기초연금',
        '만 65세 이상 어르신 중 소득인정액이 선정기준액 이하인 분께 매월 기초연금을 지급하는 제도입니다.',
        '보건복지부',
        '국민연금공단',
        '국민연금공단 콜센터 1355',
        'https://www.nps.or.kr',
        '',
        '2024',
        '2024-12-31',
        '만 65세 이상, 소득인정액 기준 하위 70%',
        '온라인 신청, 방문신청, 우편신청',
        '노인',
        1
      ],
      [
        'WF002',
        '노인돌봄종합서비스',
        '신체적·정신적 기능저하로 돌봄이 필요한 노인에게 가사·활동지원, 주간보호, 단기보호 등 종합적인 서비스를 제공합니다.',
        '보건복지부',
        '지방자치단체',
        '거주지 읍면동 주민센터',
        '',
        '',
        '2024',
        '2024-12-31',
        '65세 이상 노인 중 장기요양등급외자',
        '읍면동 주민센터 방문신청',
        '노인',
        1
      ],
      [
        'WF003',
        '아동수당',
        '0~95개월(만 8세 미만) 아동에게 월 10만원의 아동수당을 지급하여 아동양육에 따른 경제적 부담을 경감하는 제도입니다.',
        '보건복지부',
        '지방자치단체',
        '거주지 읍면동 주민센터',
        '',
        '',
        '2024',
        '2024-12-31',
        '0~95개월(만 8세 미만) 아동',
        '온라인 신청, 방문신청',
        '아동',
        1
      ]
    ];
    
    for (const data of sampleData) {
      await sequelize.query(`
        INSERT OR IGNORE INTO welfare_services (
          service_id, service_name, service_summary, ministry_name, 
          organization_name, contact_info, website, service_url,
          reference_year, last_modified_date, target_audience, 
          application_method, category, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, {
        replacements: data
      });
    }
    
    console.log('✅ 복지 서비스 샘플 데이터 추가 완료!');
    
    // 확인
    const [finalCount] = await sequelize.query('SELECT COUNT(*) as count FROM welfare_services');
    console.log(`📊 총 복지 서비스 개수: ${finalCount.count}`);
    
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