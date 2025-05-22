import PayBtn from "main/component/serviceBtn/PayBtn";
import PayReportBtn from "main/component/serviceBtn/PayReportBtn";
import WelfareBtn from "main/component/serviceBtn/WelfareBtn";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

function ButtonGruop(props) {
  const navigate = useNavigate();
  
  const handlePayClick=()=>{
    navigate("/consumption");
  }
   const handleWelfareClick=()=>{
    navigate("/welfare-main");
  }
   const handleConsumeReport=()=>{
    navigate("/consume-report");
  }
  return (
    <div className="button-group">
      <PayBtn handlePayClick={handlePayClick}/>
      <WelfareBtn handleWelfareClick={handleWelfareClick}/>      
      <PayReportBtn handleConsumeReport={handleConsumeReport}/>
    </div>
  );
}

export default ButtonGruop;