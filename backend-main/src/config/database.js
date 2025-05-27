const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'donghang',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234567',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  // 한글 인코딩 지원 추가
  dialectOptions: {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    supportBigNumbers: true,
    bigNumberStrings: true
  }
});

module.exports = sequelize;