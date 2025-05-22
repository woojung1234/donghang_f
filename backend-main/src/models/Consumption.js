const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consumption = sequelize.define('Consumption', {
  consumptionNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'consumption_no'
  },
  userNo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_no',
    references: {
      model: 'users',
      key: 'user_no'
    }
  },
  merchantName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'merchant_name'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'amount'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'category'
  },
  paymentMethod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'payment_method'
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'transaction_date'
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'location'
  },
  memo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'memo'
  },
  riskLevel: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    allowNull: false,
    defaultValue: 'LOW',
    field: 'risk_level'
  },
  isAnomalous: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_anomalous'
  }
}, {
  tableName: 'consumption',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Consumption;
