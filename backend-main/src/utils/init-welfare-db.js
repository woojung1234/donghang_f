const { sequelize, Welfare, WelfareFavorite } = require('../models');

async function initializeWelfareDatabase() {
  try {
    console.log('🔄 복지 서비스 데이터베이스 초기화 시작...');
    
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    // welfare_services 테이블 생성 (존재하지 않으면)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS welfare_services (
        welfare_no INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id VARCHAR(100) UNIQUE NOT NULL,
        service_name VARCHAR(200) NOT NULL,
        service_summary TEXT,
        ministry_name VARCHAR(100),
        organization_name VARCHAR(100),
        contact_info TEXT,
        website TEXT,
        service_url TEXT,
        reference_year VARCHAR(10),
        last_modified_date VARCHAR(50),
        target_audience TEXT,
        application_method TEXT,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // welfare_favorites 테이블 생성 (존재하지 않으면)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS welfare_favorites (
        favorite_no INTEGER PRIMARY KEY AUTOINCREMENT,
        user_no INTEGER NOT NULL,
        service_id VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_no) REFERENCES users(user_no),
        UNIQUE(user_no, service_id)
      )
    `);
    
    console.log('✅ 복지 서비스 테이블 생성 완료');
    
    // 샘플 데이터 추가 (테이블이 비어있는 경우)
    const count = await sequelize.query('SELECT COUNT(*) as count FROM welfare_services', {
      type: sequelize.QueryTypes.SELECT
    });
    
    if (count[0].count === 0) {
      console.log('📝 샘플 복지 서비스 데이터 추가 중...');
      
      const sampleData = [
        {
          service_id: 'WF001',
          service_name: '기초연금',
          service_summary: '만 65세 이상 어르신 중 소득인정액이 선정기준액 이하인 분께 매월 기초연금을 지급하는 제도입니다.',
          ministry_name: '보건복지부',
          organization_name: '국민연금공단',
          contact_info: '국민연금공단 콜센터 1355',
          website: 'https://www.nps.or.kr',
          target_audience: '만 65세 이상, 소득인정액 기준 하위 70%',
          application_method: '온라인 신청, 방문신청, 우편신청',
          category: '노인'
        },
        {
          service_id: 'WF002',
          service_name: '노인돌봄종합서비스',
          service_summary: '신체적·정신적 기능저하로 돌봄이 필요한 노인에게 가사·활동지원, 주간보호, 단기보호 등 종합적인 서비스를 제공합니다.',
          ministry_name: '보건복지부',
          organization_name: '지방자치단체',
          contact_info: '거주지 읍면동 주민센터',
          target_audience: '65세 이상 노인 중 장기요양등급외자',
          application_method: '읍면동 주민센터 방문신청',
          category: '노인'
        },
        {
          service_id: 'WF003',
          service_name: '아동수당',
          service_summary: '0~95개월(만 8세 미만) 아동에게 월 10만원의 아동수당을 지급하여 아동양육에 따른 경제적 부담을 경감하는 제도입니다.',
          ministry_name: '보건복지부',
          organization_name: '지방자치단체',
          contact_info: '거주지 읍면동 주민센터',
          target_audience: '0~95개월(만 8세 미만) 아동',
          application_method: '온라인 신청, 방문신청',
          category: '아동'
        }
      ];
      
      for (const data of sampleData) {
        await sequelize.query(`
          INSERT INTO welfare_services (
            service_id, service_name, service_summary, ministry_name, 
            organization_name, contact_info, website, target_audience, 
            application_method, category, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, {
          replacements: [
            data.service_id, data.service_name, data.service_summary, 
            data.ministry_name, data.organization_name, data.contact_info, 
            data.website, data.target_audience, data.application_method, data.category
          ]
        });
      }
      
      console.log('✅ 샘플 데이터 추가 완료');
    }
    
    console.log('🎉 복지 서비스 데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error);
    throw error;
  }
}

// 스크립트로 직접 실행할 때
if (require.main === module) {
  initializeWelfareDatabase()
    .then(() => {
      console.log('초기화 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('초기화 실패:', error);
      process.exit(1);
    });
}

module.exports = initializeWelfareDatabase;