import React, { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';


const WelfareSpec = createContext();
// WelfareSpec이라는 이름의 공유공간을 내장함수 createContext()를 이용해서 만듦
export const useSpecHook = ()=> useContext(WelfareSpec);
// 다른 파일에서도(자식 컴포넌트) 공통코드를 사용하기 위해 훅을 만듦
// useContext(WelfareSpec)는 리액트가 제공하는 기능인 useContext를 이용해서 공유공간에서 정보를 가져오는 코드
// useContext(WelfareSpec)를 useSpecHook로 줄인 것임

function WelfareInputTotal(props) {
    const [userSpec, setUserSpec] = useState({});
    // userSpec: input에서 입력 받은 값들로 만들어진 객체 {"address":"백운중앙로", "detailAddress":"505동", , , , ,}
    // setUserSpec: input에서 값을 새로 입력받아서 넣는 기능의 함수 이름
    // useState: userSpec의 상태를 관리하는 훅 (UI관련) 이걸로 바로바로 UI에 적용하는 것임

    const handlechange =(e)=>{
        setUserSpec({...userSpec, [e.target.name]:e.target.value} );
    }; // 파라미터를 e로 지정하고 해당 파라미터의 name과 value(값)를 가져와
    // 그걸 userSpec에 넣는 함수인 setUserSpec을 실행하는 handlechange함수

    useEffect(()=>{
        // console.log(userSpec);
    }, [userSpec]);

    return (
        <div>
            <WelfareSpec.Provider value={ {userSpec, setUserSpec, handlechange} }>
                <Outlet />
            </WelfareSpec.Provider>
            {/* Outlet: App.JS에서 설정한 해당 문서의 자식 컴포넌트들을 지칭함 */}
        </div>
    );
}

export default WelfareInputTotal;