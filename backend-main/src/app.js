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
const notificationRoutes = require('./routes/notifications');
const pageRoutes = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 9090;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

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
    service: '똑똑 백엔드 서버'
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
app.use('/api/v1/welfare-book', welfareBookRoutes);
app.use('/api/v1/notifications', notificationRoutes);

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
    if (process.env.NODE_ENV === 'development') {
      await database.sync({ alter: true });
      console.log('✅ Database synchronized');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📖 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
