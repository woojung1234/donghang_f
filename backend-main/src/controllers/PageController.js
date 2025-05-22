const path = require('path');

class PageController {
  /**
   * 대화 페이지 리디렉션
   */
  static conversationPage(req, res) {
    res.redirect('/conversation.html');
  }

  /**
   * STT 페이지 리디렉션
   */
  static sttPage(req, res) {
    res.redirect('/stt.html');
  }

  /**
   * 로그인 페이지 리디렉션
   */
  static loginPage(req, res) {
    res.redirect('/login.html');
  }

  /**
   * 알림 페이지 리디렉션
   */
  static notificationPage(req, res) {
    res.redirect('/Notification.html');
  }
}

module.exports = PageController;
