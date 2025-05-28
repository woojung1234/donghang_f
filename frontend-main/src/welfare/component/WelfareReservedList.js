import React, { useState, useEffect } from 'react';
import styles from 'welfare/css/WelfareReservedList.module.css';
import Modal from "react-modal";
import WelfareReserveCancelModal from 'welfare/component/WelfareReserveCancelModal';
import WelfareReservedItem from 'welfare/component/WelfareReservedItem';
import WelfareReservationDetailModal from 'welfare/component/WelfareReservationDetailModal';
import Header from 'header/BlueHeader.js';
import { call } from 'login/service/ApiService';
import info from "image/icon/info.png";

function WelfareReservedList() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [reservedItems, setReserveItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [userNo, setUserNo] = useState(null);

  useEffect(() => {
    const userNo = localStorage.getItem("userNo");
    
    if (userNo) {
      setUserNo(userNo);
    }
    fetchReservations();
  }, []);
  
  const fetchReservations = () => {
    setIsLoading(true);
    call('/api/v1/welfare-book', "GET", null)
      .then((response) => {
        console.log("Fetched reservations:", response);
        if (Array.isArray(response)) {
          setReserveItems(response);
        } else if (response.data && Array.isArray(response.data)) {
          setReserveItems(response.data);
        } else {
          console.log("Unexpected response format:", response);
          setReserveItems([]);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("복지 예약 내역 조회 실패:", error);
        setReserveItems([]);
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

  const openDetailModal = (reservation) => {
    console.log("Opening detail modal for reservation:", reservation);
    setSelectedReservation(reservation);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setSelectedReservation(null);
  };

  const handleDelete = () => {
    if (selectedItemId) {
      console.log("Cancelling reservation:", selectedItemId);
      call(`/api/v1/welfare-book/${selectedItemId}`, "DELETE", null)
        .then(() => {
          console.log("Reservation cancelled successfully");
          closeModal();
          fetchReservations(); // 목록 새로고침
        })
        .catch((error) => {
          console.error("예약 취소 실패:", error);
          alert("예약 취소 처리 중 오류가 발생했습니다.");
        });
    } else {
      alert("취소할 예약이 선택되지 않았습니다.");
    }
  };

  const filterReservations = (status) => {
    setFilter(status);
  };

  // 필터링된 예약 항목
  const filteredReservations = reservedItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'active') return !item.welfareBookIsCancel && !item.welfareBookIsComplete;
    if (filter === 'completed') return item.welfareBookIsComplete;
    if (filter === 'cancelled') return item.welfareBookIsCancel;
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
              key={item.welfareBookNo || index}
              title={item.welfare?.welfareName || "알 수 없는 서비스"}
              welfareBookReservationDate={item.welfareBookReservationDate}
              welfareBookStartDate={item.welfareBookStartDate}
              welfareBookUseTime={item.welfareBookUseTime}
              welfareTotalPrice={item.welfareBookTotalPrice}
              status={item.welfareBookIsCancel ? 'CANCELLED' : (item.welfareBookIsComplete ? 'COMPLETED' : 'PENDING')}
              paymentStatus={'PENDING'}
              onCancel={() => openModal(item.welfareBookNo)}
              onDetail={() => openDetailModal(item)}
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

      <Modal 
        isOpen={isDetailOpen} 
        onRequestClose={closeDetailModal} 
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 100
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: 0,
            border: 'none',
            background: 'transparent',
            overflow: 'visible'
          }
        }}
      >
        <WelfareReservationDetailModal 
          reservation={selectedReservation} 
          onClose={closeDetailModal} 
        />
      </Modal>
    </div>
  );
}

export default WelfareReservedList;
