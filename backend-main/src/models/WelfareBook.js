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
  welfareBookStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'welfare_book_start_date'
  },
  welfareBookEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'welfare_book_end_date'
  },
  welfareBookIsCancel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'welfare_book_is_cancel'
  },
  welfareBookIsComplete: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'welfare_book_is_complete'
  },
  welfareBookUseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'welfare_book_use_time'
  },
  welfareBookTotalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'welfare_book_total_price'
  },
  welfareBookReservationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'welfare_book_reservation_date'
  },
  specialRequest: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'special_request'
  }
}, {
  tableName: 'welfare_bookings',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = WelfareBook;
