import payReport from 'image/icon/payreport.png';

function PayReportBtn({handleConsumeReport}) {
  return (
    <div className="button" onClick={handleConsumeReport}>
      <img src={payReport} alt="소비리포트" className="icon" />
      <p className="button-text">소비리포트</p>
    </div>
  );
}

export default PayReportBtn;
