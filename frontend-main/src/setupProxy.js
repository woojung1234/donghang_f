const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d',
    createProxyMiddleware({
      target: 'https://api.odcloud.kr',
      changeOrigin: true,
      pathRewrite: {
        // 환경 변수에서 API 키를 가져와 사용
        '^/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d': `/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d?serviceKey=${process.env.REACT_APP_PUBLIC_DATA_API_KEY}`
      }
    })
  );
};