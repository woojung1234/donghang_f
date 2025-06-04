// backend-main/sync-welfare-data.js
require('dotenv').config();
const axios = require('axios');
const { Sequelize } = require('sequelize');

// 데이터베이스 연결 설정
const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'donghang',
  process.env.DB_USERNAME || 'postgres', 
  process.env.DB_PASSWORD || '1234567',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

// Welfare 모델 정의
const Welfare = sequelize.define('Welfare', {
  welfareNo: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'welfare_no'
  },
  serviceId: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true,
    field: 'service_id'
  },
  serviceName: {
    type: Sequelize.STRING(200),
    allowNull: false,
    field: 'service_name'
  },
  serviceSummary: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'service_summary'
  },
  ministryName: {
    type: Sequelize.STRING(100),
    allowNull: true,
    field: 'ministry_name'
  },
  organizationName: {
    type: Sequelize.STRING(100),
    allowNull: true,
    field: 'organization_name'
  },
  contactInfo: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'contact_info'
  },
  website: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'website'
  },
  serviceUrl: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'service_url'
  },
  referenceYear: {
    type: Sequelize.STRING(10),
    allowNull: true,
    field: 'reference_year'
  },
  lastModifiedDate: {
    type: Sequelize.STRING(50),
    allowNull: true,
    field: 'last_modified_date'
  },
  targetAudience: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'target_audience'
  },
  applicationMethod: {
    type: Sequelize.TEXT,
    allowNull: true,
    field: 'application_method'
  },
  category: {
    type: Sequelize.STRING(50),
    allowNull: true,
    field: 'category'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'welfare_services',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 카테고리 분류 함수
function categorizeService(serviceName, summary) {
  const text = `${serviceName || ''} ${summary || ''}`.toLowerCase();

  const categoryKeywords = {
    '의료/건강': ['의료', '건강', '진료', '치료', '병원', '질병', '검진', '예방접종', '재활'],
    '주거/생활': ['주거', '주택', '임대', '전세', '월세', '생활비', '난방비', '수도요금'],
    '교육/보육': ['교육', '보육', '어린이집', '유치원', '학교', '학습', '교재', '수업료'],
    '고용/취업': ['고용', '취업', '일자리', '구직', '직업', '훈련', '교육훈련', '근로'],
    '복지/돌봄': ['돌봄', '복지', '요양', '간병', '케어', '서비스', '지원', '도우미'],
    '경제/금융': ['경제', '금융', '대출', '지원금', '수당', '급여', '연금', '보조금'],
    '문화/여가': ['문화', '여가', '체육', '스포츠', '예술', '관광', '프로그램'],
    '안전/보안': ['안전', '보안', '방범', '응급', '구조', '신변보호']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  return '기타';
}

// 공공 API에서 데이터 가져오기
async function fetchWelfareData() {
  try {
    const apiKey = 'N9UqNAJj7hLzHoNXu7XozSaMGv6m6mmfrsQcmV7jK%2BJGiKvBXdNBg8WOKZ%2BhVMzqlQ6Zr4XbPvhgfww9VRgDOg%3D%3D';
    const baseUrl = 'https://apis.data.go.kr/1383000/sftf/service';
    
    console.log('📡 공공 API에서 복지서비스 데이터 가져오는 중...');
    
    const response = await axios.get(`${baseUrl}/sftfList`, {
      params: {
        serviceKey: apiKey,
        pageNo: 1,
        numOfRows: 100,
        dataType: 'json'
      },
      timeout: 30000
    });

    if (response.data && response.data.response && response.data.response.header.resultCode === '00') {
      const items = response.data.response.body.items?.item || [];
      console.log(`✅ API에서 ${items.length}개 데이터 조회 성공`);
      return items;
    } else {
      console.error('❌ API 응답 오류:', response.data?.response?.header?.resultMsg);
      return [];
    }
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
    return [];
  }
}

// 데이터 변환 및 저장
async function saveWelfareData() {
  try {
    console.log('🔗 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    const apiData = await fetchWelfareData();
    
    if (apiData.length === 0) {
      console.log('⚠️ 가져올 데이터가 없습니다.');
      return;
    }

    console.log('💾 데이터베이스에 저장 중...');
    let saved = 0;

    for (const item of apiData) {
      try {
        const welfareData = {
          serviceId: item.svcId || `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          serviceName: item.svcNm || '서비스명 없음',
          serviceSummary: item.svcSumry || null,
          ministryName: item.inqplCtgryNm || null,
          organizationName: item.jurMnofNm || null,
          contactInfo: item.svcDtlLink || null,
          website: item.svcDtlLink || null,
          serviceUrl: item.svcDtlLink || null,
          referenceYear: item.lastModYmd?.substr(0, 4) || new Date().getFullYear().toString(),
          lastModifiedDate: item.lastModYmd || new Date().toISOString().split('T')[0].replace(/-/g, ''),
          targetAudience: item.sprtTrgtCn || null,
          applicationMethod: item.aplyMthCn || null,
          category: categorizeService(item.svcNm, item.svcSumry),
          isActive: true
        };

        const existingWelfare = await Welfare.findOne({
          where: { serviceId: welfareData.serviceId }
        });

        if (existingWelfare) {
          await existingWelfare.update(welfareData);
          console.log(`🔄 업데이트: ${welfareData.serviceName}`);
        } else {
          await Welfare.create(welfareData);
          console.log(`➕ 추가: ${welfareData.serviceName}`);
          saved++;
        }

      } catch (error) {
        console.error(`❌ 데이터 저장 실패 (${item.svcNm}):`, error.message);
      }
    }

    console.log(`✅ 완료! ${saved}개의 새로운 복지서비스가 추가되었습니다.`);

  } catch (error) {
    console.error('❌ 동기화 실패:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 실행
saveWelfareData();