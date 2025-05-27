const fs = require('fs');
const path = require('path');

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('로그 파일 쓰기 실패:', error);
    }
  }

  info(message, ...args) {
    const formattedMessage = this.formatMessage('INFO', message, ...args);
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  error(message, ...args) {
    const formattedMessage = this.formatMessage('ERROR', message, ...args);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  warn(message, ...args) {
    const formattedMessage = this.formatMessage('WARN', message, ...args);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('DEBUG', message, ...args);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }
}

module.exports = new Logger();
