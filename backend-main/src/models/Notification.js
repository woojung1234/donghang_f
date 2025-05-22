const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  notificationNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'notification_no'
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'title'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'content'
  },
  notificationType: {
    type: DataTypes.ENUM('SYSTEM', 'PAYMENT', 'WELFARE', 'ANOMALY'),
    allowNull: false,
    field: 'notification_type'
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'NORMAL',
    field: 'priority'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  relatedId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'related_id',
    comment: 'Related entity ID (booking, consumption, etc.)'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'related_type',
    comment: 'Related entity type'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Notification;
