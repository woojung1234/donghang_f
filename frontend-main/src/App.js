import { createContext, useState } from 'react';
import Modal from 'react-modal';
import { Route, Routes } from 'react-router-dom';
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
import RoleCheck from 'signUp/component/RoleCheck';
import QuickLoginSetup from 'signUp/component/QuickLoginSetup';
import PinSetup from 'signUp/component/PinSetup';
import PinCheck from 'signUp/component/PinCheck';
import SignUpSuccess from 'signUp/component/SignUpSuccess';

// 마이페이지
import MyPage from 'mypage/MyPage';
import ModifyInfo from 'mypage/component/ModifyInfo';

// 소비 관리
import Consumption from 'consume/Consumption';
import ConsumeReport from 'consumeReport/component/ConsumeReport';

// 알림
import AlarmList from 'alarm/AlarmList';

// 복지 서비스
import WelfareList from 'welfare/component/WelfareList';
import WelfareMain from 'welfare/component/WelfareMain';
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
  
  return (
    <CommonContext.Provider value={{loginUser, setLoginUser}}>
      <Routes>
        {/* 온보딩 */}
        <Route path="/" element={<OnboardingNew />} />
        
        {/* 메인 화면 */}
        <Route path="/main" element={<PrivateRoute><MainA /></PrivateRoute>} />
        <Route path="/home" element={<PrivateRoute><MainPage /></PrivateRoute>} />
        
        {/* 음성 채팅 */}
        <Route path="/voicechat" element={<PrivateRoute><VoiceChat /></PrivateRoute>} />
        
        {/* 사용자 인증 */}
        <Route path="/loginbio" element={<LoginBio />} />
        <Route path="/loginid" element={<LoginId />} />
        <Route path="/loginpw" element={<LoginPw />} />
        
        {/* 회원가입 */}
        <Route path="/signup/*" element={<SignUpMain />}>
          <Route path="register" element={<Register />} />
          <Route path="infoinput" element={<InfoInput />} />
          <Route path="verifycode" element={<VerifyCode />} />
          <Route path="rolecheck" element={<RoleCheck />} />
          <Route path="quickloginsetup" element={<QuickLoginSetup />} />  
          <Route path="pinsetup" element={<PinSetup />} /> 
          <Route path="pincheck" element={<PinCheck />} />   
          <Route path="signupsuccess" element={<SignUpSuccess />} />
        </Route>
        
        {/* 마이페이지 */}
        <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
        <Route path="/modifyinfo" element={<PrivateRoute><ModifyInfo /></PrivateRoute>} />
        
        {/* 소비 관리 */}
        <Route path="/consumption" element={<PrivateRoute><Consumption /></PrivateRoute>} />
        <Route path="/consume-report" element={<PrivateRoute><ConsumeReport /></PrivateRoute>} />
        
        {/* 알림 */}
        <Route path="/alarm" element={<PrivateRoute><AlarmList /></PrivateRoute>} />
        
        {/* 복지 서비스 */}
        <Route path="/welfare-list" element={<PrivateRoute><WelfareList /></PrivateRoute>} />
        <Route path="/welfare-main" element={<PrivateRoute><WelfareMain /></PrivateRoute>} />
        
        <Route path="/welfare-reserved-list/*" element={<PrivateRoute><WelfareReservedList /></PrivateRoute>}>
          <Route path="welfare-reserve-cancelmodal" element={<PrivateRoute><WelfareReserveCancelModal /></PrivateRoute>} />
        </Route>
        
        <Route path="/welfare-input/*" element={<PrivateRoute><WelfareInputTotal /></PrivateRoute>}>
          <Route path="address" element={<PrivateRoute><WelfareInputAddress /></PrivateRoute>} />
          <Route path="address-modal" element={<PrivateRoute><WelfareAddressModal /></PrivateRoute>} />
          <Route path="birth" element={<PrivateRoute><WelfareInputBirth /></PrivateRoute>} />
          <Route path="disease" element={<PrivateRoute><WelfareInputDisease /></PrivateRoute>} />
          <Route path="gender" element={<PrivateRoute><WelfareInputGender /></PrivateRoute>} />
          <Route path="height" element={<PrivateRoute><WelfareInputHeight /></PrivateRoute>} />
          <Route path="check-spec" element={<PrivateRoute><WelfareCheckSpec /></PrivateRoute>} />
          <Route path="pay" element={<PrivateRoute><WelfarePay /></PrivateRoute>} />
          <Route path="welfare-set-pw" element={<PrivateRoute><WelfareSetPW /></PrivateRoute>} />
          <Route path="welfare-check-pw" element={<PrivateRoute><WelfareCheckPW /></PrivateRoute>} />
          <Route path="paycomplete" element={<PrivateRoute><WelfarePayComplete /></PrivateRoute>} />
          <Route path="dolbom-main" element={<PrivateRoute><DolbomMain /></PrivateRoute>} />
          <Route path="nursing-modal" element={<PrivateRoute><WelfareNursingModal /></PrivateRoute>} />
          <Route path="housework-modal" element={<PrivateRoute><WelfareHouseworkModal /></PrivateRoute>} />
          <Route path="hanwool-modal" element={<PrivateRoute><WelfareHanwoolModal /></PrivateRoute>} />
        </Route>
      </Routes>
    </CommonContext.Provider>
  );
}

export default App;
