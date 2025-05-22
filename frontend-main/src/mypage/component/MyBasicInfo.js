function MyBasicInfo({userInfo}) {

    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        return phone
            .replace(/[^0-9]/g, '')  // 숫자만 남기기
            .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'); // 하이픈 추가
    };
    return (
        <div className='info-container'>
            <div className='info-title'>
                <p>기본정보</p>
            </div>
            <div className='info-content'>
                <p>아이디</p>
                <p>{userInfo.userId}</p>
            </div>
            <div className='info-content'>
                <p>전화번호</p>
                <p>{formatPhoneNumber(userInfo.userPhone)}</p>
            </div>
        </div>
    );
}

export default MyBasicInfo;