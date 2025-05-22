import Header from "header/Header.js";
import { call } from "login/service/ApiService";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSpecHook } from "welfare/component/WelfareInputTotal";
import styles from "welfare/css/WelfareCheckSpec.module.css";
function WelfareCheckSpec() {
  const navigate = useNavigate();
  const { userSpec, setUserSpec } = useSpecHook();
  // const [loading, setLoading] = useState(true); // 로딩 상태 추가

  // 이전 페이지에서 useNavigate로 보내준 값들을 받겠다는 의미
  const location = useLocation();
  // state라는 속성(변수)에서 저 4가지 변수를 꺼내서 쓰겠다는 의미
  const {welfareNo,welfareBookStartDate,welfareBookUseTime,isExtraInfo} = location.state || {};
  

  const [userInfo, setUserInfo] = useState([]);
  const [isKnockInfo, setIsKnockInfo] = useState(true);

  const getUserInfo = async () => {
    try {
      const response = await call('/api/v1/users', "GET", null);
      setUserInfo(response);
      return response; // 유저 정보를 반환
    } catch (error) {
      console.log("회원정보 에러");
      return null; // 오류 시 null 반환
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      const userInfo = await getUserInfo(); // 유저 정보를 가져온 후에 다음 작업 진행
      if (!userInfo) return; // 유저 정보를 가져오지 못한 경우, 이후 로직 중단
  
      if (localStorage.getItem("loginUser") === "PROTECTOR") {
        // 내가 보호자인데, 이미 정보가 있을 때
        if (isExtraInfo) {
          call('/api/v1/match', "GET", null).then((response) => {
            setUserSpec((prevSpec) => ({
              ...prevSpec,
              userNo: response.userNo,
              userName: response.protegeUserName,
              userBirth: userInfo.protegeBirth,
              protegeAddress: userInfo.protegeAddress,
              protegeAddressDetail: userInfo.protegeAddressDetail,
              userGender: userInfo.protegeGender,
              userHeight: userInfo.protegeHeight,
              userWeight: userInfo.protegeWeight,
              userDisease: userInfo.protegeDisease,
            }));
          }).catch((error) => {
            console.log("피보호자 매칭조회 실패");
          });
        } else {
          // 내가 보호자인데, 정보가 없어서 이전 페이지에서 정보를 받았을 때
          call('/api/v1/match', "GET", null).then((response) => {
            setUserSpec((prevSpec) => ({
              ...prevSpec,
              userNo: response.userNo,
              userName: response.protegeUserName,
            }));
          }).catch((error) => {
            console.log("피보호자 매칭조회 실패");
          });
        }
      } else {
        // 내가 일반사용자인데, 이미 정보가 있을 때
        if (isExtraInfo) {
          setUserSpec((prevSpec) => ({
            ...prevSpec,
            userNo: userInfo.userNo,
            userName: userInfo.userName,
            userBirth: userInfo.protegeBirth,
            protegeAddress: userInfo.protegeAddress,
            protegeAddressDetail: userInfo.protegeAddressDetail,
            userGender: userInfo.protegeGender,
            userHeight: userInfo.protegeHeight,
            userWeight: userInfo.protegeWeight,
            userDisease: userInfo.protegeDisease,
          }));
        } else if (welfareNo && welfareBookStartDate && welfareBookUseTime) {
          // 내가 일반사용자인데, 똑똑이로 예약할 때
          if(userInfo.protegeGender === 0){
            //정보 없을 때
            setIsKnockInfo(false);
          } else{
            //정보 있을 때
            console.log("==============");
            setUserSpec((prevSpec) => ({
              ...prevSpec,
              welfareNo: welfareNo,
              welfareBookStartDate: welfareBookStartDate,
              welfareBookUseTime: welfareBookUseTime,
              userNo: userInfo.userNo,
              userName: userInfo.userName,
              protegeUserName: userInfo.userName,
              userBirth: userInfo.protegeBirth,
              protegeAddress: userInfo.protegeAddress,
              protegeAddressDetail: userInfo.protegeAddressDetail,
              userGender: userInfo.protegeGender,
              userHeight: userInfo.protegeHeight,
              userWeight: userInfo.protegeWeight,
              userDisease: userInfo.protegeDisease,
              welfareBookTotalPrice: calculatePrice(welfareBookUseTime)
            }));
          }
          console.log(userSpec);
          
        } else {
           // 내가 일반사용자인데, 정보가 없어서 이전 페이지에서 정보를 받았을 때
          setUserSpec((prevSpec) => ({
            ...prevSpec,
            userNo: userInfo.userNo,
            userName: userInfo.userName,
          }));
        }
      }
    };
  
    fetchData(); // 비동기 함수 호출
  }, []);

  const formattedReservationInfo = () => {
    if (!userSpec.welfareBookStartDate || !userSpec.welfareBookUseTime)
      return "";
    return `${userSpec.welfareBookStartDate}  /  ` + welfareTime();
  };
  const welfareName = () => {
    switch (userSpec.welfareNo) {
      case 1:
        return "일상 가사 돌봄";
      case 2:
        return "가정 간병 돌봄";  
      case 3:
        return "한울 돌봄";
      default:
        return null;
    }
};
const welfareTime = () => {
  switch (userSpec.welfareBookUseTime) {
    case 1:
      return "3시간 (09:00 ~ 12:00)";
    case 2:
      return "6시간 (09:00 ~ 15:00)";  
    case 3:
      return "9시간 (09:00 ~ 18:00)";
    case 4:
      return "1개월";
    case 5:
      return "2개월";
    case 6:
      return "3개월";
    case 7:
      return "4개월";
    case 8:
      return "5개월";
    case 9:
      return "6개월";
    default:
      return null;
  }
};
  const goSetPW = () => {
    navigate("/welfare-input/pay");
  };

  function calculatePrice(welfareBookUseTime) {
    if ([1, 2, 3].includes(welfareBookUseTime)) {
      return 75000 * welfareBookUseTime;
    } else if ([4, 5, 6, 7, 8, 9].includes(welfareBookUseTime)) {
      return 2000000 * (welfareBookUseTime - 3);
    } else {
      return 0;  // welfareBookUseTime이 예상 범위 밖의 값인 경우
    }
  }


  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const formatGender = (gender) => {
    if (gender === 1) {
      return "남성";
    } else if (gender === 2) {
      return "여성";
    } else {
      return "";
    }
  };


  // if (loading) {
  //   return <div>로딩중입니다...</div>; // 로딩 중일 때 표시할 내용
  // }


  return (
    <div className={styles.container}>
      <Header />
      <div className={styles["main-container"]}>
        <div className={styles["infomation-container"]}>
          <p className={styles.infomation}>입력하신 정보가</p>
          <p className={styles.infomation}>맞는지 확인 해주세요</p>
        </div>
        <div className={styles["spec-container"]}>
          <p className={styles["spec-info"]}>이름</p>
          <input
            className={styles["spec-check"]}
            type="text"
            placeholder="등록된 이름이 없습니다."
            value={userSpec.userName}
            disabled
          />
          <p className={styles["spec-info"]}>생년월일</p>
          <input
            className={styles["spec-check"]}
            type="date"
            data-placeholder="날짜 선택"
            value={formatDate(userSpec.userBirth)}
          
            disabled
          />
          <p className={styles["spec-info"]}>성별</p>
          <input
            className={styles["spec-check"]}
            type="text"
            placeholder="등록된 성별이 없습니다."
            value={
              formatGender(userSpec.userGender)
            }
            disabled
          />
          <p className={styles["spec-info"]}>주소</p>
          <input
            className={styles["spec-check"]}
            type="text"
            placeholder="등록된 주소가 없습니다."
            value={
              userSpec.protegeAddress && userSpec.protegeAddress !== "null" 
                ? `${userSpec.protegeAddress} ${userSpec.protegeAddressDetail !== "null" ? userSpec.protegeAddressDetail : ""}` 
                : ""
            }
            disabled
          />
          <p className={styles["spec-info"]}>신체</p>
          <input
            className={styles["spec-check-hw"]}
            type="number"
            placeholder="키"
            value={userSpec.userHeight || ""}
            disabled
          />
          <span className={styles.hw}>cm</span>
          <input
            className={styles["spec-check-hw"]}
            type="number"
            placeholder="몸무게"
            value={userSpec.userWeight || ""}
            disabled
          />
          <span className={styles.hw}>kg</span>
          <p className={styles["spec-info"]}>질병</p>
          <input
            className={`${styles["spec-check"]} ${styles.disease}`}
            type="text"
            placeholder="질병 내역이 없습니다."
            value={userSpec.userDisease || ""}
            disabled
          />
          <p className={styles["spec-info"]}>예약 정보</p>
          <input
            className={`${styles["spec-check"]} ${styles.last} ${styles.first}`}
            type="text"
            placeholder="예약된 정보가 없습니다."
            value={welfareName()}
            disabled
          />
          <input
            className={`${styles["spec-check"]} ${styles.last}`}
            type="text"
            placeholder="정보 없음"
            value={formattedReservationInfo()}
            disabled
          />
        </div>
        <div
          className={`${styles["main-section"]} ${styles["go-password"]} ${!isKnockInfo ? styles["disabled-btn"] : ""}`}
          onClick={isKnockInfo ? goSetPW : undefined} // Use `undefined` instead of an empty string
        >
          <p className={`${styles["main-text"]} ${styles["go-password-text"]} `}>
          {isKnockInfo ?"다음":"마이페이지에서 정보 입력 후 이용 가능"}
          </p>
        </div>
      </div>
    </div>
  );
}
export default WelfareCheckSpec;