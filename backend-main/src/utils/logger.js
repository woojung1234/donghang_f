const fs = require('fs');
const path = require('path');

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 커스텀 로깅 시스템
 * 파일과 콘솔에 동시에 로그를 기록합니다.
 */
class Logger {
  constructor() {
    // 오늘 날짜로 로그 파일 생성
    this.updateLogFile();
    
    // 매일 자정에 로그 파일 갱신
    setInterval(() => this.updateLogFile(), 24 * 60 * 60 * 1000);
    
    // 에러 로그 파일 별도 관리
    this.errorLogFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
  }
  
  /**
   * 날짜별 로그 파일 업데이트
   */
  updateLogFile() {
    const today = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logDir, `app-${today}.log`);
    this.errorLogFile = path.join(logDir, `errors-${today}.log`);
  }

  /**
   * 로그 메시지 포맷팅
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    
    // 객체를 읽기 쉽게 포맷팅
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Circular Object]';
        }
      } else {
        return String(arg);
      }
    }).join(' ') : '';
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  /**
   * 파일에 로그 기록
   */
  writeToFile(message, isError = false) {
    try {
      // 일반 로그는 항상 기록
      fs.appendFileSync(this.logFile, message + '\n');
      
      // 에러 로그는 별도 파일에도 기록
      if (isError) {
        fs.appendFileSync(this.errorLogFile, message + '\n');
      }
    } catch (error) {
      console.error('로그 파일 쓰기 실패:', error);
    }
  }

  /**
   * 정보 로그
   */
  info(message, ...args) {
    const formattedMessage = this.formatMessage('INFO', message, ...args);
    console.log('\x1b[32m%s\x1b[0m', formattedMessage);  // 녹색
    this.writeToFile(formattedMessage);
  }

  /**
   * 에러 로그
   */
  error(message, ...args) {
    const formattedMessage = this.formatMessage('ERROR', message, ...args);
    console.error('\x1b[31m%s\x1b[0m', formattedMessage);  // 빨간색
    this.writeToFile(formattedMessage, true);
  }

  /**
   * 경고 로그
   */
  warn(message, ...args) {
    const formattedMessage = this.formatMessage('WARN', message, ...args);
    console.warn('\x1b[33m%s\x1b[0m', formattedMessage);  // 노란색
    this.writeToFile(formattedMessage);
  }

  /**
   * 디버그 로그 (개발 환경에서만)
   */
  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('DEBUG', message, ...args);
      console.log('\x1b[36m%s\x1b[0m', formattedMessage);  // 청록색
      this.writeToFile(formattedMessage);
    }
  }
  
  /**
   * 성공 로그
   */
  success(message, ...args) {
    const formattedMessage = this.formatMessage('SUCCESS', message, ...args);
    console.log('\x1b[32m%s\x1b[0m', formattedMessage);  // 녹색
    this.writeToFile(formattedMessage);
  }
}

module.exports = new Logger();
