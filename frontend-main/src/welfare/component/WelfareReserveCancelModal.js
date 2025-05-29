import React from 'react';
import styles from 'welfare/css/WelfareReserveCancelModal.module.css';

function WelfareReserveCancelModal({ closeModal, handleDelete  }) {
  
  return (
    <div className={styles.container}>
      <div className={styles["main-container"]}>
        <div className={`${styles["main-section"]} ${styles["modal-container"]}`}>
          <div style={{ paddingTop: '30px' }}>
            <p className={`${styles["main-text"]} ${styles["cancel-title"]}`}>예약 취소</p>
            <hr style={{ margin: '20px 35px' }} />
          </div>
          <div className={styles["really-container"]}>
            <span className={styles["total-price-text"]}>
              정말로 예약을 <span className={styles.blue}>취소</span>하시겠습니까?
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 35px 35px 35px' }}>
            <span className={`${styles["main-text"]} ${styles["reserved-cancel-cancel"]}`} onClick={closeModal}>닫기</span>
            <span className={`${styles["main-text"]} ${styles["reserved-cancel-yeah"]}`} onClick={handleDelete}>예</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelfareReserveCancelModal;
