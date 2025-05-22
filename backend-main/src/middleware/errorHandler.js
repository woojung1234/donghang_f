const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error
  let error = {
    message: err.message || '서버 내부 오류가 발생했습니다.',
    status: err.status || 500
  };

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    error.message = err.errors.map(e => e.message).join(', ');
    error.status = 400;
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    error.message = '이미 존재하는 데이터입니다.';
    error.status = 409;
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error.message = '유효하지 않은 토큰입니다.';
    error.status = 401;
  }

  // Token expired error
  if (err.name === 'TokenExpiredError') {
    error.message = '토큰이 만료되었습니다.';
    error.status = 401;
  }

  res.status(error.status).json({
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
