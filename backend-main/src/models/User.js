const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  userNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'user_no'
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'user_id'
  },
  userPassword: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'user_password'
  },
  userName: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'user_name'
  },
  userPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'user_phone'
  },
  userType: {
    type: DataTypes.ENUM('USER', 'PROTEGE'),
    allowNull: false,
    defaultValue: 'USER',
    field: 'user_type'
  },
  userBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'user_birth'
  },
  userGender: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'user_gender'
  },
  userAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_address'
  },
  userDetailAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_detail_address'
  },
  userZipcode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'user_zipcode'
  },
  userHeight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_height'
  },
  userWeight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_weight'
  },
  userDisease: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_disease'
  },
  simplePassword: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'simple_password'
  },
  biometricData: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'biometric_data'
  },
  loginType: {
    type: DataTypes.ENUM('ID', 'SIMPLE', 'BIOMETRIC'),
    allowNull: false,
    defaultValue: 'ID',
    field: 'login_type'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;