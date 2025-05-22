import React from 'react';
// 제거된 카드 관련 기능들 주석 처리
// import AddressSearchComponent from 'cardCreate/application/AddressSearchComponent';
import glasses from "image/glasses.png";
import { useEffect, useState } from 'react';

function InfoInput({ protegeInfo, handleChange }) {
    const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
    const [address, setAddress] = useState(protegeInfo.userAddress);
    
    useEffect(() => {
        if (protegeInfo.userAddress) {
            setAddress(protegeInfo.userAddress);
        }
    }, [protegeInfo.userAddress]);

    const handleComplete = (data) => {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
            if (data.bname !== "") {
                extraAddress += data.bname;
            }
            if (data.buildingName) {
                extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress ? ` (${extraAddress})` : "";
        }
        setAddress(fullAddress);
        setIsPostcodeOpen(false);
        handleChange({ target: { name: 'userAddress', value: fullAddress } });
    };

    return (
        <div className='infoInput-container'>
            <div className='infoInput-box'>
                <p>생년월일</p>
                <input type='date' 
                    name='userBirth' 
                    defaultValue={protegeInfo.userBirth} 
                    onChange={handleChange}
                    placeholder="생년월일" required/>
            </div>
            <div className='infoInput-box'>
                <p>성별</p>
                <div className='infoInput-gender'>
                    <label>
                        <input type='radio' 
                            name='userGender' 
                            value="1"
                            onChange={handleChange}
                            checked={protegeInfo.userGender === '1'}
                        />
                        <div className='custom-radio'></div>
                        <p>남</p>
                    </label>
                    <label>
                        <input type='radio' 
                            name='userGender' 
                            value="2"
                            checked={protegeInfo.userGender === '2'}
                            onChange={handleChange}
                        />
                        <div className='custom-radio'></div>
                        <p>여</p>
                    </label>         
                </div>
            </div>
            <div className='bodyInfo'>
                <div className='bodyInfo-box'>
                    <p>키</p>
                    <div className='body-content'>
                        <input type='number' 
                            name='userHeight' 
                            defaultValue={protegeInfo.userHeight} 
                            onChange={handleChange}
                            placeholder="키" required/>
                        <p>cm</p>
                    </div>
                </div>
                <div className='bodyInfo-box'>
                    <p>몸무게</p>
                    <div className='body-content'>
                        <input type='number' 
                            name='userWeight' 
                            defaultValue={protegeInfo.userWeight} 
                            onChange={handleChange}
                            placeholder="몸무게" required/>
                        <p>kg</p>
                    </div>
                </div>
            </div>
            <div className='infoInput-box'>
                <p>질병</p>
                <input type='text'
                    name='userDisease' 
                    defaultValue={protegeInfo.userDisease} 
                    onChange={handleChange}
                    placeholder="질병"/>
            </div>
            <div className='infoInput-box'>
                <p>주소</p>
                <div onClick={() => setIsPostcodeOpen(true)} className='addressSearch'>
                    <input 
                        type='text' 
                        placeholder="도로명, 지번, 건물명 검색"
                        value={address} 
                        onChange={handleChange} 
                        className='addressInfo'
                        name='userAddress'
                        required
                    />
                    <img src={glasses} alt="돋보기" className="addressInfo-icon" />
                </div>

                {isPostcodeOpen && (
                    <AddressSearchComponent
                        onComplete={handleComplete}
                        onClose={() => setIsPostcodeOpen(false)}
                    />
                )}
                <input type='text' 
                    name='userAddressDetail' 
                    defaultValue={protegeInfo.userAddressDetail} 
                    onChange={handleChange}
                    placeholder="상세주소" required/>
            </div>
        </div>
    );
}

export default InfoInput;