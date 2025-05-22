const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Welfare = sequelize.define('Welfare', {
  welfareNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'welfare_no'
  },
  welfareName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'welfare_name'
  },
  welfareDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'welfare_description'
  },
  welfareType: {
    type: DataTypes.ENUM('NURSING', 'HOUSEWORK', 'HANWOOL'),
    allowNull: false,
    field: 'welfare_type'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration',
    comment: 'Duration in minutes'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  maxCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'max_capacity'
  }
}, {
  tableName: 'welfare_services',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Welfare;
