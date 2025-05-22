const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '똑똑 백엔드 API',
      version: '1.0.0',
      description: '똑똑 애플리케이션 Node.js 백엔드 API 문서',
      contact: {
        name: 'Development Team',
        email: 'dev@knockknock.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.knockknock.com' 
          : `http://localhost:${process.env.PORT || 9090}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // Swagger 주석이 있는 파일들의 경로
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
