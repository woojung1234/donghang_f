// 파일: src/App.js
// 카드 관련 라우팅 정리 및 음성 입력 소비 기록 시스템으로 변경

import { createContext, useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Route, Routes, useNavigate } from 'react-router-dom';
import PrivateRoute from 'PrivateRoute';

// 온보딩 및 메인
import OnboardingNew from 'onboarding/OnboardingNew';
import MainA from 'main/MainA';
import MainPage from 'home/MainPage';

// 음성 채팅
import VoiceChat from 'chat/VoiceChat';

// 사용자 인증
import LoginBio from 'login/LoginBio';
import LoginId from 'login/LoginId';
import LoginPw from 'login/LoginPw';

// 회원가입
import SignUpMain from 'signUp/SignUpMain';
import Register from 'signUp/component/Register';
import InfoInput from 'signUp/component/InfoInput';
import VerifyCode from 'signUp/component/VerifyCode';
// RoleCheck 컴포넌트 제거
import QuickLoginSetup from 'signUp/component/QuickLoginSetup';
import PinSetup from 'signUp/component/PinSetup';
import PinCheck from 'signUp/component/PinCheck';
import SignUpSuccess from 'signUp/component/SignUpSuccess';

// 마이페이지
import MyPage from 'mypage/MyPage';
import ModifyInfo from 'mypage/component/ModifyInfo';

// 소비 관리 (음성 입력 기반으로 변경됨)
import Consumption from 'consume/Consumption';
import ConsumeReport from 'consumeReport/component/ConsumeReport';

// 알림
import AlarmList from 'alarm/AlarmList';

// 복지 서비스 (카드 결제 → 간편 결제로 변경됨)
import WelfareList from 'welfare/component/WelfareList';
import WelfareMain from 'welfare/component/WelfareMain';
import WelfareServices from 'welfare/component/WelfareServices';
import WelfareReservedList from 'welfare/component/WelfareReservedList';
import WelfareReserveCancelModal from 'welfare/component/WelfareReserveCancelModal';
import WelfareInputTotal from 'welfare/component/WelfareInputTotal';
import WelfareInputAddress from 'welfare/component/WelfareInputAddress';
import WelfareAddressModal from 'welfare/component/WelfareAddressModal';
import WelfareInputBirth from 'welfare/component/WelfareInputBirth';
import WelfareInputDisease from 'welfare/component/WelfareInputDisease';
import WelfareInputGender from 'welfare/component/WelfareInputGender';
import WelfareInputHeight from 'welfare/component/WelfareInputHeight';
import WelfareCheckSpec from 'welfare/component/WelfareCheckSpec';
import WelfarePay from 'welfare/component/WelfarePay';
import WelfareSetPW from 'welfare/component/WelfareSetPW';
import WelfareCheckPW from 'welfare/component/WelfareCheckPW';
import WelfarePayComplete from 'welfare/component/WelfarePayCompl';
import DolbomMain from 'welfare/component/DolbomMain';
import WelfareNursingModal from 'welfare/component/WelfareNursingModal';
import WelfareHouseworkModal from 'welfare/component/WelfareHouseworkModal';
import WelfareHanwoolModal from 'welfare/component/WelfareHanwoolModal';

import 'index.css';

Modal.setAppElement('#root');

export const CommonContext = createContext();

function App() {
  const [loginUser, setLoginUser] = useState({});
  
  // 로그인 정보 로드
  useEffect(() => {
    const userType = localStorage.getItem("loginUser");
    const userNo = localStorage.getItem("userNo");
    
    if (userType && userNo) {
      // 로그인 정보가 있으면 상태 업데이트
      setLoginUser({
        userType: userType,
        userNo: userNo
      });
      console.log("로그인 정보 로드됨:", userType, userNo);
    }
  }, []);
  
  // 음성 입력 관련 전역 상태 추가
  const [voiceSettings, setVoiceSettings] = useState({
    isVoiceEnabled: true,
    autoSave: true,
    voiceLanguage: 'ko-KR'
  });

  return (
    <CommonContext.Provider value={{
      loginUser, 
      setLoginUser,
      voiceSettings,
      setVoiceSettings
    }}>
      <Routes>
        {/* 온보딩 */}
        <Route path="/" element={<LoginId />} />

        {/* 온보딩은 별도 경로로 이동 */}
        <Route path="/onboarding" element={<OnboardingNew />} />
        
        {/* 메인 화면 */}
        <Route path="/main" element={<PrivateRoute><MainA /></PrivateRoute>} />
        <Route path="/home" element={<PrivateRoute><MainPage /></PrivateRoute>} />
        
        {/* 음성 채팅 (음성 입력 시스템과 연동 강화) */}
        <Route path="/voicechat" element={<PrivateRoute><VoiceChat /></PrivateRoute>} />
        
        {/* 사용자 인증 */}
        <Route path="/loginbio" element={<LoginBio />} />
        <Route path="/loginid" element={<LoginId />} />
        <Route path="/loginpw" element={<LoginPw />} />
        
        {/* 회원가입 - rolecheck 단계 제거 */}
        <Route path="/signup/*" element={<SignUpMain />}>
          <Route path="register" element={<Register />} />
          <Route path="infoinput" element={<InfoInput />} />
          <Route path="verifycode" element={<VerifyCode />} />
          <Route path="quickloginsetup" element={<QuickLoginSetup />} />  
          <Route path="pinsetup" element={<PinSetup />} /> 
          <Route path="pincheck" element={<PinCheck />} />   
          <Route path="signupsuccess" element={<SignUpSuccess />} />
        </Route>
        
        {/* 마이페이지 */}
        <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
        <Route path="/modifyinfo" element={<PrivateRoute><ModifyInfo /></PrivateRoute>} />
        
        {/* 소비 관리 (음성 입력 기반) */}
        <Route path="/consumption" element={<PrivateRoute><Consumption /></PrivateRoute>} />
        <Route path="/consume-report" element={<PrivateRoute><ConsumeReport /></PrivateRoute>} />
        
        {/* 음성 소비 기록 전용 라우트 추가 */}
        <Route path="/voice-consumption" element={<PrivateRoute><Consumption /></PrivateRoute>} />
        
        {/* 알림 */}
        <Route path="/alarm" element={<PrivateRoute><AlarmList /></PrivateRoute>} />
        
        {/* 복지 서비스 (간편 결제 시스템) */}
        <Route path="/welfare-list" element={<PrivateRoute><WelfareList /></PrivateRoute>} />
        <Route path="/welfare-main" element={<PrivateRoute><WelfareMain /></PrivateRoute>} />
        <Route path="/welfare-services" element={<PrivateRoute><WelfareServices /></PrivateRoute>} />
        
        {/* 복지 서비스 예약 관리 */}
        <Route path="/welfare-reserved-list/*" element={<PrivateRoute><WelfareReservedList /></PrivateRoute>}>
          <Route path="welfare-reserve-cancelmodal" element={<PrivateRoute><WelfareReserveCancelModal /></PrivateRoute>} />
        </Route>
        
        {/* 복지 서비스 신청 및 결제 프로세스 */}
        <Route path="/welfare-input/*" element={<PrivateRoute><WelfareInputTotal /></PrivateRoute>}>
          {/* 개인정보 입력 단계 */}
          <Route path="address" element={<PrivateRoute><WelfareInputAddress /></PrivateRoute>} />
          <Route path="address-modal" element={<PrivateRoute><WelfareAddressModal /></PrivateRoute>} />
          <Route path="birth" element={<PrivateRoute><WelfareInputBirth /></PrivateRoute>} />
          <Route path="disease" element={<PrivateRoute><WelfareInputDisease /></PrivateRoute>} />
          <Route path="gender" element={<PrivateRoute><WelfareInputGender /></PrivateRoute>} />
          <Route path="height" element={<PrivateRoute><WelfareInputHeight /></PrivateRoute>} />
          <Route path="check-spec" element={<PrivateRoute><WelfareCheckSpec /></PrivateRoute>} />
          
          {/* 결제 단계 (카드 선택 → 간편 결제로 변경됨) */}
          <Route path="pay" element={<PrivateRoute><WelfarePay /></PrivateRoute>} />
          <Route path="welfare-set-pw" element={<PrivateRoute><WelfareSetPW /></PrivateRoute>} />
          <Route path="welfare-check-pw" element={<PrivateRoute><WelfareCheckPW /></PrivateRoute>} />
          <Route path="paycomplete" element={<PrivateRoute><WelfarePayComplete /></PrivateRoute>} />
          
          {/* 돌봄 서비스 */}
          <Route path="dolbom-main" element={<PrivateRoute><DolbomMain /></PrivateRoute>} />
          <Route path="nursing-modal" element={<PrivateRoute><WelfareNursingModal /></PrivateRoute>} />
          <Route path="housework-modal" element={<PrivateRoute><WelfareHouseworkModal /></PrivateRoute>} />
          <Route path="hanwool-modal" element={<PrivateRoute><WelfareHanwoolModal /></PrivateRoute>} />
        </Route>

        {/* 결제 완료 페이지 독립 라우트 */}
        <Route path="/welfare-pay-compl" element={<PrivateRoute><WelfarePayComplete /></PrivateRoute>} />
        
        {/* 404 페이지 추가 */}
        <Route path="*" element={
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center'
          }}>
            <h1>404 - 페이지를 찾을 수 없습니다</h1>
            <p>요청하신 페이지가 존재하지 않습니다.</p>
            <button 
              onClick={() => window.location.href = '/home'}
              style={{
                padding: '10px 20px',
                marginTop: '20px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              홈으로 가기
            </button>
          </div>
        } />
      </Routes>
    </CommonContext.Provider>
  );
}

export default App;