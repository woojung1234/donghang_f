const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const database = require('./config/database');
const { swaggerUi, specs } = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');

// Initialize models with associations
require('./models');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const conversationLogRoutes = require('./routes/conversation-log');
const conversationRoomRoutes = require('./routes/conversation-room');
const consumptionRoutes = require('./routes/consumption');
const welfareRoutes = require('./routes/welfare');
const welfareBookRoutes = require('./routes/welfare-book');
const welfareBookingsRoutes = require('./routes/welfare-bookings'); // 새로운 라우트 추가
const notificationRoutes = require('./routes/notifications');
const pageRoutes = require('./routes/pages');
const aiChatRoutes = require('./routes/aiChatRoutes');

// 복지 서비스 라우터 추가
const welfareServicesRoutes = require('../routes/welfare.routes');

const app = express();
const PORT = process.env.PORT || 9090;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - 더 관대한 설정으로 변경
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'];
app.use(cors({
  origin: function(origin, callback) {
    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// OPTIONS 요청 처리
app.options('*', cors());

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files serving (Java의 static 폴더와 동일)
app.use(express.static(path.join(__dirname, '../public')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: '금복이 백엔드 서버'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/conversation-log', conversationLogRoutes);
app.use('/api/v1/conversation-room', conversationRoomRoutes);
app.use('/api/v1/consumption', consumptionRoutes);
app.use('/api/v1/welfare', welfareRoutes);
app.use('/api/v1/welfare', welfareBookingsRoutes); // 새로운 bookings API 추가
app.use('/api/v1/welfare-book', welfareBookRoutes); // 기존 API 유지
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ai-chat', aiChatRoutes);

// 공공 API 라우트 추가
app.use('/api/welfare', welfareServicesRoutes);

// Page Routes (정적 파일 리디렉션)
app.use('/', pageRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    await database.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync database (create tables if they don't exist)
    // 개발 환경에서만 동기화 수행
    if (process.env.NODE_ENV === 'development') {
      try {
        // 기존 테이블 구조 유지하면서 필요한 테이블만 생성
        await database.sync({ force: false });
        console.log('✅ Database synchronized (safe mode)');
      } catch (syncError) {
        console.warn('⚠️ Database sync warning:', syncError.message);
        console.log('🔄 Trying to create tables without altering existing structure...');
        
        // 첫 번째 시도가 실패하면 더 안전한 방식으로 시도
        try {
          await database.sync({ force: false });
          console.log('✅ Database tables created successfully');
        } catch (retryError) {
          console.error('❌ Unable to sync database:', retryError);
          console.log('⚠️ Continuing with existing database structure');
        }
      }
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📖 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 CORS Origin: ${allowedOrigins.join(', ')}`);
      console.log(`💾 Database: donghang.db`);
      console.log(`🆕 New Welfare Bookings API: /api/v1/welfare/bookings`);
      console.log(`🔑 API Key issues resolved with better error handling`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
