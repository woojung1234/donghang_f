import "cardCreate/application/CardApplication.css";
import Header from "header/Header.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddressSearchComponent from "cardCreate/application/AddressSearchComponent";
import { useSpecHook } from "./WelfareInputTotal";

function WelfareInputAddress() {
  const navigate = useNavigate();
  const { userSpec, setUserSpec } = useSpecHook();

  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [protegeAddress, setProtegeAddress] = useState(""); // 도로명 주소를 저장할 상태
  const [protegeAddressDetail, setProtegeAddressDetail] = useState(""); // 상세주소를 저장할 상태

  const handlePaging = () => {
    if (isButtonEnabled) {
      navigate("/welfare-input/disease");
    }
  };

  // 다음 주소검색 api
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  const handleComplete = (data) => {
    setProtegeAddress(data.address); // 선택된 주소를 protegeAddress 상태에 저장
    setIsPostcodeOpen(false); // 주소 검색 후 창 닫기

    // userSpec에 주소 업데이트
    setUserSpec({ ...userSpec, protegeAddress: data.address });
  };

  // 상세주소 변경 시 처리
  const handleDetailAddressChange = (e) => {
    const value = e.target.value;
    setProtegeAddressDetail(value);

    // userSpec에 상세주소 업데이트
    setUserSpec({ ...userSpec, protegeAddressDetail: value });
  };

  // 빈칸 확인
  useEffect(() => {
    const isFull = (protegeAddress?.trim() || "") !== "" && (protegeAddressDetail?.trim() || "") !== "";
    setIsButtonEnabled(isFull);
  }, [protegeAddress, protegeAddressDetail]);

  return (
    <div className="card-app-container">
      <Header />
      <div className="app-title">
        <div className="title-text">
          <span>집주소를</span>
          <br />
          <span>입력해주세요</span>
        </div>
      </div>
      <div className="app-input-container">
        <div className="app-input">
          <input
            placeholder="도로명, 지번, 건물명 검색"
            value={protegeAddress || ""}
            onClick={() => setIsPostcodeOpen(true)}
            readOnly
          />
        </div>
        <div className="app-input">
          <input
            placeholder="상세주소"
            value={protegeAddressDetail || ""}
            onChange={handleDetailAddressChange}
          />
        </div>
      </div>

        <button
          className="appBtn addrBtn"
          onClick={handlePaging}
          disabled={!isButtonEnabled}
          style={{
            backgroundColor: isButtonEnabled
              ? "#80BAFF"
              : "rgba(128,186,255,0.5)",
            height: "60px",
          }}
        >
          다음
        </button>
      {isPostcodeOpen && (
        <AddressSearchComponent
          onComplete={handleComplete}
          onClose={() => setIsPostcodeOpen(false)}
        />
      )}
    </div>
  );
}

export default WelfareInputAddress;
