// create-donghang-db.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

async function createDonghangDatabase() {
  // postgres 데이터베이스에 연결
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres', // 기본 데이터베이스
    username: 'postgres',
    password: '1234567',
    logging: console.log
  });

  try {
    await sequelize.authenticate();
    console.log('✅ postgres 데이터베이스 연결 성공!');
    
    // donghang 데이터베이스 생성 시도
    console.log('donghang 데이터베이스 생성 시도...');
    await sequelize.query('CREATE DATABASE donghang;');
    console.log('✅ donghang 데이터베이스 생성 성공!');
    
    // donghang 데이터베이스 연결 시도
    const donghangSequelize = new Sequelize({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'donghang',
      username: 'postgres',
      password: '1234567',
      logging: console.log
    });
    
    await donghangSequelize.authenticate();
    console.log('✅ donghang 데이터베이스 연결 성공!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

createDonghangDatabase();