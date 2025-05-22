const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WelfareBook = sequelize.define('WelfareBook', {
  bookNo: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'book_no'
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
  welfareNo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'welfare_no',
    references: {
      model: 'welfare_services',
      key: 'welfare_no'
    }
  },
  bookingDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'booking_date'
  },
  bookingTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'booking_time'
  },
  status: {
    type: DataTypes.ENUM('RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'RESERVED',
    field: 'status'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price'
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'REFUNDED'),
    allowNull: false,
    defaultValue: 'PENDING',
    field: 'payment_status'
  },
  specialRequest: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'special_request'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at'
  }
}, {
  tableName: 'welfare_bookings',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = WelfareBook;
