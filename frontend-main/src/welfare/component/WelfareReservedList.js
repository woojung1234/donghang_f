import React, { useState, useEffect } from 'react';
import styles from 'welfare/css/WelfareReservedList.module.css';
import Modal from "react-modal";
import WelfareReserveCancelModal from 'welfare/component/WelfareReserveCancelModal';
import WelfareReservedItem from 'welfare/component/WelfareReservedItem';
import Header from 'header/BlueHeader.js';
import { call } from 'login/service/ApiService';
import info from "image/icon/info.png";

function WelfareReservedList() {
  const [isOpen, setIsOpen] = useState(false);
  const [reservedItems, setReserveItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isProtege, setIsProtege] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'cancelled'

  const [protegeUserNo, setProtegeUserNo] = useState(null);
  const [userNo, setUserNo] = useState(null);


  useEffect(() => {
    // 보호자 기능 제거로 모든 사용자를 동일하게 처리
    const userType = localStorage.getItem("loginUser");
    const userNo = localStorage.getItem("userNo");
    
    if (userNo) {
      setUserNo(userNo);
      setIsProtege(false);
      fetchReservations();
    } else {
      setIsProtege(false);
      fetchReservations();
    }
  }, []);
  
  const fetchReservations = () => {
    setIsLoading(true);
    call('/api/v1/welfare/bookings', "GET", null)
      .then((response) => {
        console.log("Fetched reservations:", response);
        if (response.bookings) {
          setReserveItems(response.bookings);
        } else {
          setReserveItems(response);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("복지목록 조회 실패:", error);
        alert("복지목록 조회 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const openModal = (itemId) => {
    console.log("Opening modal for item ID:", itemId);
    setSelectedItemId(itemId);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedItemId(null);
  };

  const handleDelete = () => {
    if (selectedItemId) {
      console.log("Cancelling reservation:", selectedItemId);
      call(`/api/v1/welfare/bookings/${selectedItemId}/cancel`, "PUT", null)
        .then(() => {
          console.log("Reservation cancelled successfully");
          closeModal();
          fetchReservations(); // 목록 새로고침
        })
        .catch((error) => {
          console.error("삭제 실패:", error);
          alert("삭제 처리 중 오류가 발생했습니다.");
        });
    } else {
      alert("삭제할 항목이 선택되지 않았습니다.");
    }
  };

  const filterReservations = (status) => {
    setFilter(status);
  };

  // 필터링된 예약 항목
  const filteredReservations = reservedItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'active') return item.status === 'PENDING' || item.status === 'CONFIRMED';
    if (filter === 'completed') return item.status === 'COMPLETED';
    if (filter === 'cancelled') return item.status === 'CANCELLED';
    return true;
  });

  const CancelStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 100
    },
    content: {
      height: "250px",
      margin: "auto",
      borderRadius: "15px",
      padding: "20px",
    },
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.filterContainer}>
        <button 
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`} 
          onClick={() => filterReservations('all')}>
          전체
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'active' ? styles.active : ''}`} 
          onClick={() => filterReservations('active')}>
          예약 중
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'completed' ? styles.active : ''}`} 
          onClick={() => filterReservations('completed')}>
          이용 완료
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'cancelled' ? styles.active : ''}`} 
          onClick={() => filterReservations('cancelled')}>
          취소
        </button>
      </div>

      <div className={styles["main-container"]}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <p>예약 내역을 불러오는 중...</p>
          </div>
        ) : filteredReservations.length > 0 ? (
          filteredReservations.map((item, index) => (
            <WelfareReservedItem
              key={index}
              title={item.welfareId?.serviceName || "알 수 없는 서비스"}
              welfareBookReservationDate={item.bookingDate}
              welfareBookStartDate={item.bookingDate}
              welfareBookUseTime={item.bookingTime}
              welfareTotalPrice={item.paymentAmount}
              status={item.status}
              paymentStatus={item.paymentStatus}
              onCancel={() => openModal(item._id)}
            />
          ))
        ) : (
          <div className={styles.noItemsContainer}>
            <img src={info} alt='느낌표'></img>
            <p className={styles.noItems}>예약된 서비스가 없습니다.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onRequestClose={closeModal} style={CancelStyles}>
        <WelfareReserveCancelModal closeModal={closeModal} handleDelete={handleDelete} />
      </Modal>
    </div>
  );
}

export default WelfareReservedList;
