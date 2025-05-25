const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Welfare = sequelize.define('Welfare', {
  welfareNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'welfare_no'
  },
  serviceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'service_id',
    comment: '서비스 아이디'
  },
  serviceName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'service_name',
    comment: '서비스명'
  },
  serviceSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'service_summary',
    comment: '서비스 요약'
  },
  ministryName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'ministry_name',
    comment: '소관부처명'
  },
  organizationName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'organization_name',
    comment: '소관조직명'
  },
  contactInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'contact_info',
    comment: '대표문의'
  },
  website: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'website',
    comment: '사이트'
  },
  serviceUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'service_url',
    comment: '서비스URL'
  },
  referenceYear: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'reference_year',
    comment: '기준연도'
  },
  lastModifiedDate: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'last_modified_date',
    comment: '최종수정일'
  },
  targetAudience: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'target_audience',
    comment: '지원대상'
  },
  applicationMethod: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'application_method',
    comment: '신청방법'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'category',
    comment: '카테고리'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
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

module.exports = Welfare;