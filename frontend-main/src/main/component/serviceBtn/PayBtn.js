import payhistory from 'image/icon/payhistory.png';

function PayBtn({handlePayClick}) {
  return (
    <div className="button" onClick={handlePayClick}>
      <img src={payhistory} alt="소비내역" className="icon" />
      <p className="button-text">소비내역</p>
    </div>
  );
}

export default PayBtn;
