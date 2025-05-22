import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const accessToken = localStorage.getItem("ACCESS_TOKEN");

  if (!accessToken) {
    alert("로그인 후 이용해주세요");
    return <Navigate to="/loginid" replace />;
  }

  return children;
}

export default PrivateRoute;