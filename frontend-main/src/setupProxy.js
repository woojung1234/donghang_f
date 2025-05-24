const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 공공 데이터 API 프록시 설정
  app.use(
    '/api/welfare',
    createProxyMiddleware({
      target: 'https://api.odcloud.kr',
      changeOrigin: true,
      pathRewrite: {
        // 실제 API 경로로 리다이렉트
        '^/api/welfare': '/api/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d'
      },
      onProxyReq: function(proxyReq, req, res) {
        // API 키 추가 (공공데이터포털은 일반적으로 serviceKey 파라미터 사용)
        const apiKey = process.env.REACT_APP_PUBLIC_DATA_API_KEY;
        
        // URL에 API 키 추가
        const url = new URL(proxyReq.path, 'https://api.odcloud.kr');
        
        // 이미 serviceKey가 있는지 확인
        if (!url.searchParams.has('serviceKey') && apiKey) {
          url.searchParams.append('serviceKey', apiKey);
        }
        
        // 한글 인코딩 문제 해결을 위해 덮어쓰기
        proxyReq.path = url.pathname + url.search;
        
        console.log('Proxying to:', proxyReq.path);
      }
    })
  );
};