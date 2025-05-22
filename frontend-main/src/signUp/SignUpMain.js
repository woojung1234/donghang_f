import { createContext, useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./SignUpMain.css";

export const UserContext = createContext();
export const useMember = ()=>useContext(UserContext);

function SignUpMain(props) {
    const [userInfo, setUserInfo] = useState({isBioLogin: false});
    const handlechange =(e)=>{
        setUserInfo({...userInfo, [e.target.name]:e.target.value} );
        const { name, value } = e.target;
        if (name === "userId") {
            // 영문자와 숫자만 허용
            const filteredValue = value.replace(/[^a-zA-Z0-9]/g, "");
            setUserInfo({ ...userInfo, [name]: filteredValue });
        } else {
            setUserInfo({ ...userInfo, [name]: value });
        }
    };
   
    return (
        <div>
            <UserContext.Provider value={{userInfo, setUserInfo, handlechange}}>
                <Outlet/>
            </UserContext.Provider>


        </div>
    );
}

export default SignUpMain;