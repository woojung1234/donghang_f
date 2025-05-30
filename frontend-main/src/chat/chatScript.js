import { call } from "login/service/ApiService";
// 🚀 새로 추가
import offlineStorage from '../services/offlineStorage';

var roomNo = 1; // 기본값 설정
var recognition;

// 오프라인 모드용 응답 (백엔드에서 처리되지 못한 경우 fallback)
const fallbackResponses = [
  "죄송합니다. 서버와 연결할 수 없어 응답을 처리하지 못했습니다.",
  "네트워크 문제로 요청을 처리하지 못했습니다. 다시 시도해주세요.",
  "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
];

// 음성 인식을 자동으로 시작하는 함수
export function startAutoRecord() {
  if (recognition) {
    try {
      // 이미 실행 중인지 확인
      if (recognition.abort) {
        recognition.abort(); // 기존 인식 중지
      }
      
      setTimeout(() => {
        try {
          recognition.start();
          console.log("🎙️ 음성 인식 자동 시작");
        } catch (error) {
          console.error("음성 인식 시작 오류:", error);
        }
      }, 100); // 짧은 지연 추가
      
    } catch (e) {
      console.error("음성 인식 시작 오류:", e);
    }
  } else {
    console.error("Recognition 객체가 초기화되지 않았습니다.");
  }
}

// 음성 인식을 중단하는 함수
export function endRecord() {
  if (recognition && recognition.stop) {
    try {
      recognition.stop();
      console.log("🛑 음성 인식 중단");
    } catch (e) {
      console.error("음성 인식 중단 오류:", e);
    }
  } else {
    console.error("Recognition 객체가 없거나 stop 메소드가 없습니다.");
  }
}

// AI 서비스 처리 (백엔드 API 호출) - 🚀 오프라인 기능 추가
async function processAIResponse(message, sessionId = 'default') {
  try {
    // 🚀 오프라인 상태 확인
    if (!navigator.onLine) {
      console.log('🔌 오프라인 상태 - 로컬 처리');
      
      // 가계부 입력 패턴 확인
      const expensePattern = /(\d+)\s*원.*?(먹|샀|썼|지출|결제|마셨|타고|갔다|사용)/;
      if (expensePattern.test(message)) {
        // 오프라인 가계부 저장
        const expenseData = parseExpenseFromMessage(message);
        await offlineStorage.saveExpenseOffline(expenseData);
        
        return {
          type: 'expense_offline',
          content: `오프라인 상태에서 "${expenseData.amount}원 ${expenseData.category}" 지출을 임시 저장했어요. 인터넷 연결 후 자동으로 동기화됩니다.`,
          needsVoice: true
        };
      }
      
      // 일반 오프라인 응답
      return {
        type: 'offline',
        content: '현재 오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.',
        needsVoice: true
      };
    }
    
    // 기존 온라인 처리 로직
    console.log("🔄 백엔드 AI 서비스 호출:", message);
    
    // 로그인 토큰 확인
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      console.warn('로그인 토큰이 없습니다.');
      return {
        type: 'error',
        content: '로그인이 필요합니다. 다시 로그인해주세요.',
        needsVoice: true
      };
    }
    
    // 백엔드 AI 채팅 API 호출
    const response = await call('/api/v1/ai-chat/message', 'POST', {
      message: message,
      sessionId: sessionId
    });
    
    console.log("🤖 백엔드 AI 응답:", response);
    
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error("AI 서비스 오류:", error);
    
    // 네트워크 오류인 경우 fallback 응답
    return {
      type: 'error',
      content: getOfflineResponse(),
      needsVoice: true
    };
  }
}

// 오프라인 fallback 응답 생성
function getOfflineResponse() {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// 🚀 기존 handleAutoSub 함수 (그대로 유지)
export function handleAutoSub(
  message,
  setChatResponse,
  setIsLoading,
  setIsSpeaking,
  setIsOpen,
  setServiceUrl,
  setWelfareNo,
  setWelfareBookStartDate,
  setWelfareBookUseTime,
  setShowConfirmModal
) {
  setIsLoading(true);
  setIsSpeaking(false);

  console.log("🔄 대화 처리:", message);
  
  // 백엔드 AI 서비스 호출
  processAIResponse(message).then(result => {
    console.log("🤖 AI 응답 결과:", result);
    
    const response = result.content || result.message || "응답을 처리하지 못했습니다.";
    
    setChatResponse(response);
    setIsLoading(false);
    setIsSpeaking(true);
    
    // 🚀 대화 저장 (오프라인 대응)
    saveConversationOffline(message, response);
    
    // 복지로 사이트 이동 요청인 경우 확인 팝업 표시
    if (result.type === 'welfare_portal_request' && result.needsConfirmation) {
      console.log("🌐 복지로 사이트 이동 요청 감지");
      
      // 음성으로 응답 읽기
      if ('speechSynthesis' in window && result.needsVoice) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsSpeaking(false);
          // 음성 응답 후 팝업 표시
          setTimeout(() => {
            showWelfarePortalConfirm(result.actionUrl, setShowConfirmModal);
          }, 500);
        };
        speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        // 음성 없이 바로 팝업 표시
        setTimeout(() => {
          showWelfarePortalConfirm(result.actionUrl, setShowConfirmModal);
        }, 1000);
      }
      return;
    }

    // 복지서비스 예약 완료인 경우 예약 페이지로 이동
    if (result.type === 'booking_confirmed' && result.needsNavigation && result.navigationData) {
      console.log("📋 복지서비스 예약 완료 - 예약 페이지로 이동");
      
      // 음성으로 응답 읽기
      if ('speechSynthesis' in window && result.needsVoice) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsSpeaking(false);
          // 음성 응답 후 예약 페이지로 이동
          setTimeout(() => {
            showWelfareBookingPageConfirm(result.navigationData, setShowConfirmModal);
          }, 500);
        };
        speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        // 음성 없이 바로 예약 페이지로 이동
        setTimeout(() => {
          showWelfareBookingPageConfirm(result.navigationData, setShowConfirmModal);
        }, 1000);
      }
      return;
    }

    // 복지서비스 예약 취소 요청인 경우 처리
    if ((result.type === 'booking_cancel_single' || 
         result.type === 'booking_cancel_multiple' || 
         result.type === 'booking_cancel_none' ||
         result.type === 'booking_cancelled_success' ||
         result.type === 'booking_cancelled_error') && result.needsVoice) {
      console.log("🗑️ 복지서비스 예약 취소 응답:", result.type);
      
      // 음성으로 응답 읽기
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsSpeaking(false);
          
          // 예약 취소 관련 응답인 경우 예약 내역 페이지로 이동 모달 표시
          if (result.type === 'booking_cancel_single' || 
              result.type === 'booking_cancel_multiple' || 
              result.type === 'booking_cancel_none') {
            console.log("🔄 예약 내역 페이지 이동 모달 표시");
            setTimeout(() => {
              showWelfareReservedListConfirm(setShowConfirmModal);
            }, 500);
          } else {
            // 취소 완료 또는 에러인 경우 일반적으로 음성 인식 재시작
            setTimeout(() => {
              startAutoRecord();
            }, 1000);
          }
        };
        speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
        
        // 예약 취소 관련 응답인 경우 예약 내역 페이지로 이동 모달 표시
        if (result.type === 'booking_cancel_single' || 
            result.type === 'booking_cancel_multiple' || 
            result.type === 'booking_cancel_none') {
          setTimeout(() => {
            showWelfareReservedListConfirm(setShowConfirmModal);
          }, 1000);
        } else {
          setTimeout(() => {
            startAutoRecord();
          }, 1000);
        }
      }
      return;
    }
    
    // 일반 응답 처리
    // 음성으로 응답 읽기
    if ('speechSynthesis' in window && result.needsVoice) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      };
      speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsSpeaking(false);
        startAutoRecord();
      }, 2000);
    }
  }).catch(error => {
    console.error("AI 서비스 오류:", error);
    setChatResponse("죄송합니다. 대화를 처리하는 중 오류가 발생했습니다.");
    setIsLoading(false);
    setIsSpeaking(false);
    setTimeout(() => {
      startAutoRecord();
    }, 1000);
  });
}

// 🚀 기존 함수들 (그대로 유지)
export function availabilityFunc(sendMessage, setIsListening) {
  const newRecognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  newRecognition.lang = "ko";
  newRecognition.maxAlternatives = 5;

  newRecognition.addEventListener("speechstart", () => {
    console.log("음성 인식 중...");
    setIsListening(true);
  });

  newRecognition.addEventListener("speechend", () => {
    console.log("음성 인식 종료");
    setIsListening(false);
  });

  newRecognition.addEventListener("result", (e) => {
    const recognizedText = e.results[0][0].transcript;
    console.log('🎙️ 인식된 텍스트:', recognizedText);
    sendMessage(recognizedText);
  });

  if (!newRecognition) {
    console.log("음성 인식을 지원하지 않는 브라우저입니다.");
  } else {
    console.log("음성 인식이 초기화되었습니다.");
    recognition = newRecognition;
    return newRecognition;
  }
}

export function handleChatRoom(userInfo) {
  console.log("💬 대화방 생성 함수 호출됨");
  return Promise.resolve({ conversationRoomNo: 1 });
}

export async function resetChatSession(sessionId = 'default') {
  try {
    const response = await call('/api/v1/ai-chat/reset-session', 'POST', {
      sessionId: sessionId
    });
    
    console.log("🔄 채팅 세션 리셋 완료:", response);
    return true;
  } catch (error) {
    console.error("채팅 세션 리셋 오류:", error);
    return false;
  }
}

export async function getChatSessionStatus(sessionId = 'default') {
  try {
    const response = await call(`/api/v1/ai-chat/session/${sessionId}`, 'GET');
    
    console.log("📊 채팅 세션 상태:", response);
    return response.data;
  } catch (error) {
    console.error("채팅 세션 상태 조회 오류:", error);
    return null;
  }
}

function showWelfarePortalConfirm(actionUrl, setShowConfirmModal) {
  console.log("🌐 복지로 사이트 이동 확인 팝업 표시");
  
  if (setShowConfirmModal) {
    setShowConfirmModal({
      show: true,
      title: '이동',
      message: '복지로 사이트로 이동하시겠습니까?',
      actionUrl: actionUrl,
      onConfirm: () => {
        console.log("✅ 복지로 사이트 이동 확인");
        window.open(actionUrl, '_blank');
        setShowConfirmModal({ show: false });
        // 음성 인식 재시작
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      },
      onCancel: () => {
        console.log("❌ 복지로 사이트 이동 취소");
        setShowConfirmModal({ show: false });
        // 음성 인식 재시작
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      }
    });
  }
}

function showWelfareBookingPageConfirm(navigationData, setShowConfirmModal) {
  console.log("📋 복지서비스 예약 페이지 이동 확인 팝업 표시:", navigationData);
  
  if (setShowConfirmModal) {
    setShowConfirmModal({
      show: true,
      title: '예약 페이지 이동',
      message: '복지서비스 예약 페이지로 이동하시겠습니까?',
      navigationData: navigationData,
      onConfirm: () => {
        console.log("✅ 복지서비스 예약 페이지 이동 확인");
        
        // 예약 페이지로 이동하면서 데이터 전달
        const bookingUrl = '/welfare-booking';
        const queryParams = new URLSearchParams({
          serviceId: navigationData.serviceId,
          serviceName: navigationData.serviceName,
          startDate: navigationData.startDate,
          endDate: navigationData.endDate,
          timeOption: navigationData.timeOption,
          address: navigationData.address
        });
        
        window.location.href = `${bookingUrl}?${queryParams.toString()}`;
        setShowConfirmModal({ show: false });
      },
      onCancel: () => {
        console.log("❌ 복지서비스 예약 페이지 이동 취소");
        setShowConfirmModal({ show: false });
        // 음성 인식 재시작
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      }
    });
  }
}

function showWelfareReservedListConfirm(setShowConfirmModal) {
  console.log("🗑️ 복지서비스 예약 내역 페이지 이동 확인 팝업 표시");
  
  if (setShowConfirmModal) {
    setShowConfirmModal({
      show: true,
      title: '예약 내역',
      message: '복지서비스 예약 내역 페이지로 이동하시겠습니까?',
      onConfirm: () => {
        console.log("✅ 복지서비스 예약 내역 페이지 이동 확인");
        // 예약 내역 페이지로 이동
        window.location.href = '/welfare-reserved-list';
        setShowConfirmModal({ show: false });
      },
      onCancel: () => {
        console.log("❌ 복지서비스 예약 내역 페이지 이동 취소");
        setShowConfirmModal({ show: false });
        // 음성 인식 재시작
        setTimeout(() => {
          startAutoRecord();
        }, 1000);
      }
    });
  }
}

// 🚀 새로 추가할 함수들

// 간단한 가계부 파싱 함수
function parseExpenseFromMessage(message) {
  const amountMatch = message.match(/(\d+)\s*원/);
  const amount = amountMatch ? parseInt(amountMatch[1]) : 0;
  
  // 간단한 카테고리 추론
  let category = '기타';
  if (message.includes('밥') || message.includes('먹') || message.includes('식사')) category = '식비';
  else if (message.includes('교통') || message.includes('버스') || message.includes('지하철')) category = '교통비';
  else if (message.includes('쇼핑') || message.includes('옷') || message.includes('샀')) category = '쇼핑';
  else if (message.includes('병원') || message.includes('약')) category = '의료비';
  else if (message.includes('마트') || message.includes('편의점')) category = '생활용품';
  
  return {
    amount,
    category,
    merchantName: '일반가맹점',
    originalMessage: message,
    date: new Date().toISOString().split('T')[0]
  };
}

// 온라인 복구시 동기화 함수
export async function syncOfflineData() {
  if (!navigator.onLine) return;
  
  try {
    const unsyncedExpenses = await offlineStorage.getUnsyncedExpenses();
    
    for (const expense of unsyncedExpenses) {
      try {
        // 백엔드로 전송
        await call('/api/v1/consumption', 'POST', {
          merchantName: expense.merchantName,
          amount: expense.amount,
          category: expense.category,
          memo: `오프라인 저장: ${expense.originalMessage}`,
          transactionDate: expense.date
        });
        
        // 동기화 완료 표시
        await offlineStorage.markAsSynced(expense.id);
        console.log('💾 오프라인 데이터 동기화 완료:', expense);
        
      } catch (error) {
        console.error('동기화 실패:', error);
      }
    }
  } catch (error) {
    console.error('동기화 프로세스 오류:', error);
  }
}

// 대화 저장 함수 (오프라인용)
export async function saveConversationOffline(userMessage, aiResponse) {
  try {
    await offlineStorage.saveConversation(userMessage, aiResponse);
    console.log('💬 대화 오프라인 저장 완료');
  } catch (error) {
    console.error('대화 저장 오류:', error);
  }
}