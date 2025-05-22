import { useLocation } from 'react-router-dom';
import "login/component/header/LoginHeader.css";

function LoginHeader(props) {
    const location = useLocation();

      // 경로에 따라 제목을 설정하는 함수
      const getTitle = (pathname) => {
        switch (pathname) {
            case '/loginbio':
                return '생체인증 로그인';
            case '/loginid':
                return '아이디 로그인';
            case '/loginpw':
                return '간편비밀번호 로그인';
                
            // => 추가 경로에 따라 제목 설정
            default:
                return '';
        }
    };

    return (
        <header>
            <div className="login-header-container">
                <p className="login-header-name">{getTitle(location.pathname)}</p>
            </div>
           
        </header>
    );
}

export default LoginHeader;