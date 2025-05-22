const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConversationLog = sequelize.define('ConversationLog', {
  logNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'log_no'
  },
  roomNo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'room_no',
    references: {
      model: 'conversation_rooms',
      key: 'room_no'
    }
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
  messageType: {
    type: DataTypes.ENUM('USER', 'AI'),
    allowNull: false,
    field: 'message_type'
  },
  messageContent: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'message_content'
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'response_time',
    comment: 'Response time in milliseconds'
  },
  aiModel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ai_model'
  },
  classification: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'classification'
  }
}, {
  tableName: 'conversation_logs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ConversationLog;
