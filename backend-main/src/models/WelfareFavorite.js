const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WelfareFavorite = sequelize.define('WelfareFavorite', {
  favoriteNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'favorite_no'
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
  serviceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'service_id',
    comment: '복지 서비스 ID'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'welfare_favorites',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_no', 'service_id']
    }
  ]
});

module.exports = WelfareFavorite;