const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 백엔드 서버 API 프록시 설정
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:9090',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api'  // 변경 없이 그대로 전달
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying to backend:', req.method, req.url);
      },
      onProxyRes: function(proxyRes, req, res) {
        // CORS 헤더 추가
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'X-Requested-With,content-type,Authorization';
      },
      onError: function(err, req, res) {
        console.error('Proxy Error:', err);
        res.status(500).json({
          error: 'Proxy Error',
          message: err.message,
          target: 'http://localhost:9090'
        });
      }
    })
  );
};
