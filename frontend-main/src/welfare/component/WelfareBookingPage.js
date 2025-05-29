import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from 'header/BlueHeader';
import { call } from 'login/service/ApiService';
import styles from 'welfare/css/WelfareBookingPage.module.css';
import Modal from 'react-modal';
import WelfareBookingModal from 'welfare/component/WelfareBookingModal';

function WelfareBookingPage() {
  const [welfareServices, setWelfareServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [voiceBookingData, setVoiceBookingData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchWelfareServices();
    // URL 파라미터에서 음성 예약 데이터 추출
    checkForVoiceBookingData();
  }, []);

  const checkForVoiceBookingData = () => {
    const params = new URLSearchParams(location.search);
    const serviceId = params.get('serviceId');
    const serviceName = params.get('serviceName');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    const timeOption = params.get('timeOption');
    const address = params.get('address');

    if (serviceId && serviceName) {
      console.log('🎙️ 음성 예약 데이터 감지:', {
        serviceId,
        serviceName,
        startDate,
        endDate,
        timeOption,
        address
      });
      
      setVoiceBookingData({
        serviceId: parseInt(serviceId),
        serviceName: decodeURIComponent(serviceName),
        startDate,
        endDate,
        timeOption: parseInt(timeOption),
        address: decodeURIComponent(address)
      });
    }
  };

  const fetchWelfareServices = async () => {
    try {
      setLoading(true);
      const response = await call('/api/v1/welfare', 'GET', null);
      
      console.log('복지서비스 목록:', response);
      
      // 백엔드에서 배열을 직접 반환하므로
      if (Array.isArray(response)) {
        setWelfareServices(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setWelfareServices(response.data);
      } else if (response && response.data && response.data.services) {
        setWelfareServices(response.data.services);
      } else {
        console.log('예상치 못한 응답 형식:', response);
        setWelfareServices([]);
      }
      setError(null);
      
      // 음성 예약 데이터가 있으면 해당 서비스로 자동 모달 열기
      if (voiceBookingData) {
        const targetService = (Array.isArray(response) ? response : response?.data || [])
          .find(service => service.welfareNo === voiceBookingData.serviceId);
        
        if (targetService) {
          console.log('🎙️ 음성 예약 서비스 자동 선택:', targetService.welfareName);
          setSelectedService(targetService);
          setIsModalOpen(true);
        }
      }
      
    } catch (err) {
      console.error('복지서비스 목록 조회 실패:', err);
      setError('복지서비스 목록을 불러오는데 실패했습니다.');
      setWelfareServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleBookingSuccess = () => {
    closeModal();
    navigate('/welfare-reserved-list');
  };

  const filteredServices = welfareServices.filter(service => {
    if (filter === 'all') return true;
    if (filter === 'housework') return service.welfareCategory === '가사지원';
    if (filter === 'nursing') return service.welfareCategory === '간병지원';
    if (filter === 'emotional') return service.welfareCategory === '정서지원';
    return true;
  });

  const modalStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'auto',
      borderRadius: '15px',
      padding: '20px'
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.mainContainer}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>복지서비스 예약하기</h1>
          <p className={styles.pageSubtitle}>원하는 복지서비스를 선택하여 예약해보세요</p>
        </div>

        {/* 필터 버튼 */}
        <div className={styles.filterContainer}>
          <button 
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'housework' ? styles.active : ''}`}
            onClick={() => setFilter('housework')}
          >
            가사지원
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'nursing' ? styles.active : ''}`}
            onClick={() => setFilter('nursing')}
          >
            간병지원
          </button>
          <button 
            className={`${styles.filterButton} ${filter === 'emotional' ? styles.active : ''}`}
            onClick={() => setFilter('emotional')}
          >
            정서지원
          </button>
        </div>

        {/* 서비스 목록 */}
        <div className={styles.servicesList}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <p>복지서비스를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
              <button className={styles.retryButton} onClick={fetchWelfareServices}>
                다시 시도
              </button>
            </div>
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service, index) => (
              <div key={service.welfareNo || index} className={styles.serviceCard}>
                <div className={styles.serviceHeader}>
                  <h3 className={styles.serviceName}>{service.welfareName}</h3>
                  <div className={styles.servicePrice}>
                    <span className={styles.priceTag}>
                      {new Intl.NumberFormat('ko-KR').format(service.welfarePrice)}원/시간
                    </span>
                  </div>
                </div>
                
                <div className={styles.serviceInfo}>
                  <p className={styles.serviceCategory}>
                    <span className={styles.categoryTag}>{service.welfareCategory}</span>
                  </p>
                  {service.welfareDescription && (
                    <p className={styles.serviceDescription}>{service.welfareDescription}</p>
                  )}
                </div>

                <button 
                  className={styles.bookingButton}
                  onClick={() => handleServiceSelect(service)}
                >
                  예약하기
                </button>
              </div>
            ))
          ) : (
            <div className={styles.noServicesContainer}>
              <p>이용 가능한 복지서비스가 없습니다.</p>
              <button className={styles.retryButton} onClick={fetchWelfareServices}>
                새로고침
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 예약 모달 */}
      <Modal 
        isOpen={isModalOpen} 
        onRequestClose={closeModal} 
        style={modalStyles}
        ariaHideApp={false}
      >
        {selectedService && (
          <WelfareBookingModal 
            service={selectedService}
            onClose={closeModal}
            onSuccess={handleBookingSuccess}
            voiceBookingData={voiceBookingData}
          />
        )}
      </Modal>
    </div>
  );
}

export default WelfareBookingPage;
