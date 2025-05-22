const sequelize = require('../config/database');

// 모델 imports
const User = require('./User');
const ConversationRoom = require('./ConversationRoom');
const ConversationLog = require('./ConversationLog');
const Consumption = require('./Consumption');
const Welfare = require('./Welfare');
const WelfareBook = require('./WelfareBook');
const Notification = require('./Notification');

// 모델 관계 설정 (Java Entity의 관계를 그대로 구현)

// User와 ConversationRoom 관계 (1:N)
User.hasMany(ConversationRoom, {
  foreignKey: 'userNo',
  as: 'conversationRooms'
});
ConversationRoom.belongsTo(User, {
  foreignKey: 'userNo',
  as: 'user'
});

// ConversationRoom과 ConversationLog 관계 (1:N)
ConversationRoom.hasMany(ConversationLog, {
  foreignKey: 'conversationRoomNo',
  as: 'conversationLogs'
});
ConversationLog.belongsTo(ConversationRoom, {
  foreignKey: 'conversationRoomNo',
  as: 'conversationRoom'
});

// User와 Consumption 관계 (1:N)
User.hasMany(Consumption, {
  foreignKey: 'userNo',
  as: 'consumptions'
});
Consumption.belongsTo(User, {
  foreignKey: 'userNo',
  as: 'user'
});

// User와 WelfareBook 관계 (1:N)
User.hasMany(WelfareBook, {
  foreignKey: 'userNo',
  as: 'welfareBooks'
});
WelfareBook.belongsTo(User, {
  foreignKey: 'userNo',
  as: 'user'
});

// Welfare와 WelfareBook 관계 (1:N)
Welfare.hasMany(WelfareBook, {
  foreignKey: 'welfareNo',
  as: 'welfareBooks'
});
WelfareBook.belongsTo(Welfare, {
  foreignKey: 'welfareNo',
  as: 'welfare'
});

// User와 Notification 관계 (1:N)
User.hasMany(Notification, {
  foreignKey: 'userNo',
  as: 'notifications'
});
Notification.belongsTo(User, {
  foreignKey: 'userNo',
  as: 'user'
});

// ConversationLog와 ConversationRoom 관계에서 lastMessage 관계 추가
ConversationRoom.hasOne(ConversationLog, {
  foreignKey: 'conversationRoomNo',
  as: 'lastMessage',
  order: [['conversationLogCreatedAt', 'DESC']]
});

// 모델들을 내보내기
module.exports = {
  sequelize,
  User,
  ConversationRoom,
  ConversationLog,
  Consumption,
  Welfare,
  WelfareBook,
  Notification
};
