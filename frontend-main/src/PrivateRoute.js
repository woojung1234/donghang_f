// 수정 후 (변경 필요한 부분)
import { Navigate, useLocation } from "react-router-dom";
import { useContext } from 'react';
import { CommonContext } from './App';

function PrivateRoute({ children }) {
  const { loginUser } = useContext(CommonContext);
  const location = useLocation();
  const accessToken = localStorage.getItem("ACCESS_TOKEN");

  // 더 엄격한 검증: 토큰이 있고 유저 정보도 있는지 확인
  if (!accessToken || !loginUser || Object.keys(loginUser).length === 0) {
    alert("로그인 후 이용해주세요");
    // 현재 접근하려던 경로 정보를 state로 전달
    return <Navigate to="/loginid" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default PrivateRoute;