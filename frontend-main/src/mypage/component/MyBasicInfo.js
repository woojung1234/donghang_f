function MyBasicInfo({userInfo}) {
    console.log('MyBasicInfo - userInfo:', userInfo);

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        return phone
            .replace(/[^0-9]/g, '')  // 숫자만 남기기
            .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'); // 하이픈 추가
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return '';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age + '세';
    };

    return (
        <div className='info-container'>
            <div className='info-title'>
                <p>기본정보</p>
            </div>
            <div className='info-content'>
                <p>아이디</p>
                <p>{userInfo.userId || ''}</p>
            </div>
            <div className='info-content'>
                <p>이름</p>
                <p>{userInfo.userName || ''}</p>
            </div>
            <div className='info-content'>
                <p>전화번호</p>
                <p>{formatPhoneNumber(userInfo.userPhone)}</p>
            </div>
            <div className='info-content'>
                <p>성별</p>
                <p>{userInfo.userGender || ''}</p>
            </div>
            <div className='info-content'>
                <p>나이</p>
                <p>{calculateAge(userInfo.userBirth)}</p>
            </div>
            <div className='info-content'>
                <p>지병</p>
                <p>{userInfo.userDisease || '없음'}</p>
            </div>
        </div>
    );
}

export default MyBasicInfo;