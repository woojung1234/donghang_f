const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WelfareBook = sequelize.define('WelfareBook', {
  welfareBookNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'welfare_book_no'
  },
  userNo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_no',
    //references: {
     // model: 'users',
     // key: 'user_no'
    //}
  },
  welfareNo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'welfare_no'
    // references 제거 - 하드코딩된 서비스 사용
  },
  // 예약자 개인정보
  userName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'user_name',
    comment: '예약자 이름'
  },
  userBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'user_birth',
    comment: '예약자 생년월일'
  },
  userGender: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'user_gender',
    comment: '예약자 성별'
  },
  userAddress: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'user_address',
    comment: '예약자 주소'
  },
  userDetailAddress: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'user_detail_address',
    comment: '예약자 상세주소'
  },
  userPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'user_phone',
    comment: '예약자 연락처'
  },
  userHeight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_height',
    comment: '예약자 신장(cm)'
  },
  userWeight: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_weight',
    comment: '예약자 체중(kg)'
  },
  userMedicalInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_medical_info',
    comment: '예약자 특이사항'
  },
  // 예약 정보
  welfareBookStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'welfare_book_start_date',
    comment: '서비스 시작일'
  },
  welfareBookEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'welfare_book_end_date',
    comment: '서비스 종료일'
  },
  welfareBookUseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'welfare_book_use_time',
    comment: '이용 시간 (시간 단위)'
  },
  welfareBookTotalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'welfare_book_total_price',
    comment: '총 결제 금액'
  },
  welfareBookReservationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'welfare_book_reservation_date',
    comment: '예약 일시'
  },
  specialRequest: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'special_request',
    comment: '특별 요청사항'
  },
  // 상태 관리
  welfareBookIsComplete: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'welfare_book_is_complete',
    comment: '서비스 완료 여부'
  },
  welfareBookIsCancel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'welfare_book_is_cancel',
    comment: '예약 취소 여부'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
    comment: '취소 일시'
  }
}, {
  tableName: 'welfare_bookings',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = WelfareBook;
