const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    message: `요청하신 경로 ${req.originalUrl}를 찾을 수 없습니다.`,
    error: 'NOT_FOUND'
  });
};

module.exports = notFoundHandler;
