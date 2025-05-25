const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 백엔드 서버 API 프록시 설정
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:9090',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'  // 변경 없이 그대로 전달
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying to backend:', proxyReq.path);
      }
    })
  );
};