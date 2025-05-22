const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConversationRoom = sequelize.define('ConversationRoom', {
  roomNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'room_no'
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
  roomName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'room_name'
  },
  roomDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'room_description'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at'
  }
}, {
  tableName: 'conversation_rooms',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ConversationRoom;
