import { Link } from 'react-router-dom';
import check from 'image/icon/check.svg';

function SignUpSuccess(props) {

    return (
        <div>
            <div className='success-container'>
                <div className="icon-success">
                    <div className='success-circle'/>
                    <img src={check} alt="회원가입 성공" className="chkImg"/>
                </div>
                <p className='signup-success'>회원가입 완료</p>
            </div>
            <div className='signUpBtn'>
                <Link to="/loginid" className='goLoginBtn'>로그인 하러 가기</Link>
            </div>
        </div>
    );
}

export default SignUpSuccess;