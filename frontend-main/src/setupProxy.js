const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d',
    createProxyMiddleware({
      target: 'https://api.odcloud.kr',
      changeOrigin: true,
      pathRewrite: {
        // 공공데이터포털은 보통 경로에 serviceKey 파라미터 필요
        '^/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d': '/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d'
      },
      onProxyReq: function(proxyReq, req, res) {
        // 쿼리 파라미터로 API 키 추가
        const url = new URL(proxyReq.path, 'https://api.odcloud.kr');
        url.searchParams.append('serviceKey', process.env.REACT_APP_PUBLIC_DATA_API_KEY);
        proxyReq.path = url.pathname + url.search;
      }
    })
  );
};