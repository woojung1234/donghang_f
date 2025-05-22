import Header from 'header/Header';
import { call } from 'login/service/ApiService';
import "mypage/component/ModifyInfo.css";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InfoInput from 'mypage/component/InfoInput';

function ModifyInfo() {
    const userType = localStorage.getItem("loginUser");
    const navi = useNavigate();
    const [infoInput, setInfoInput] = useState({});
    const handleChange = (e) => {
        const { name, value } = e.target;
        setInfoInput((prev) => ({ ...prev, [name]: value }));
    };

    const buttonStyle = userType === "PROTEGE" ? { backgroundColor: '#FF961B'} : {};
    useEffect(() => {
        call('/api/v1/users', 'GET', null)
            .then(response => {
                setInfoInput({
                    userBirth:response.protegeBirth,
                    userGender:response.protegeGender?.toString(),
                    userHeight:response.protegeHeight,
                    userWeight:response.protegeWeight,
                    userDisease:response.protegeDisease,
                    userAddress:response.protegeAddress,
                    userAddressDetail:response.protegeAddressDetail

                });
            })
            .catch(error => {
                console.error("정보 입력 실패", error);
            });
    }, []);


    const handleSubmit = (e) => {
        e.preventDefault(); // form의 기본 동작인 페이지 새로고침 방지
        call("/api/v1/users", "PUT", infoInput)
        .then((response) => navi("/mypage"))
        .catch((error) => {console.log("실패");});
    };

    return (
        <div className='modiInfo-container'>
            <Header />
            <div className="app-title">
                <div className="title-text">
                    <span>부가 정보를 입력해 주세요</span>
                </div>
            </div>
            <form onSubmit={handleSubmit} className='modiInfo-form'>
                <InfoInput protegeInfo={infoInput} handleChange={handleChange} />
                <button className='modiInfo-saveBtn' style={buttonStyle}>저장</button>
            </form>
        </div>
    );
}

export default ModifyInfo;