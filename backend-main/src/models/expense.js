const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    expenseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'expense_id'
    },
    userNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_no',
      references: {
        model: 'users',
        key: 'user_no'
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '소비 금액'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '소비 카테고리 (식비, 교통비, 의료비 등)'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '소비 내역 설명'
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'expense_date',
      comment: '소비 날짜'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'expenses',
    timestamps: true
  });

  Expense.associate = (models) => {
    Expense.belongsTo(models.User, { 
      foreignKey: 'userNo', 
      as: 'user' 
    });
  };

  return Expense;
};
