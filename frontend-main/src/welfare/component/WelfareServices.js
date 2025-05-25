import React, { useEffect, useState } from 'react';
import Header from 'header/BlueHeader';
import styles from 'welfare/css/WelfareServices.module.css';
import { getPublicWelfareServices } from 'services/welfareService';

function WelfareServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => {
    const fetchWelfareServices = async () => {
      try {
        console.log('복지 서비스 데이터 가져오기 시작');
        
        // 서비스 모듈을 통한 API 호출
        const response = await getPublicWelfareServices(page, perPage);
        
        console.log('API 응답:', response);
        
        // API 응답 데이터 처리
        if (response && response.data) {
          console.log('복지 서비스 데이터 받음:', response.data);
          setServices(response.data);
          setLoading(false);
        } else {
          console.log('데이터 없음 또는 형식 불일치:', response);
          setError('데이터 형식이 예상과 다릅니다.');
          setLoading(false);
        }
      } catch (err) {
        console.error('복지 서비스 데이터를 가져오는 중 오류가 발생했습니다:', err);
        
        // 더 자세한 오류 정보 로깅
        if (err.response) {
          // 서버 응답이 있는 경우
          console.error('오류 응답:', err.response.data);
          console.error('오류 상태:', err.response.status);
          console.error('오류 헤더:', err.response.headers);
        } else if (err.request) {
          // 요청은 보냈지만 응답이 없는 경우
          console.error('요청은 보냈으나 응답이 없음:', err.request);
        } else {
          // 요청 설정 중에 오류가 발생한 경우
          console.error('요청 설정 오류:', err.message);
        }
        
        setError(`복지 서비스 데이터를 가져오는 중 오류가 발생했습니다: ${err.message}`);
        setLoading(false);
      }
    };

    fetchWelfareServices();
  }, [page, perPage]);

  const handleServiceClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('연결된 URL이 없습니다.');
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // 페이지를 다시 로드하여 API 호출 재시도
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>복지 서비스</h1>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <p>복지 서비스 정보를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={handleRetry}>다시 시도</button>
          </div>
        ) : services.length > 0 ? (
          <div className={styles.servicesContainer}>
            {services.map((service, index) => (
              <div 
                key={service.serviceId || index} 
                className={styles.serviceCard}
                onClick={() => handleServiceClick(service.serviceUrl || service.website)}
              >
                <h2 className={styles.serviceName}>{service.serviceName}</h2>
                <p className={styles.serviceProvider}>
                  {service.ministryName} {service.organizationName ? `(${service.organizationName})` : ''}
                </p>
                <p className={styles.serviceDescription}>{service.serviceSummary}</p>
                <div className={styles.serviceDetails}>
                  {service.targetAudience && (
                    <p className={styles.serviceTarget}>
                      <span className={styles.label}>지원대상:</span> {service.targetAudience}
                    </p>
                  )}
                  {service.applicationMethod && (
                    <p className={styles.serviceApplication}>
                      <span className={styles.label}>신청방법:</span> {service.applicationMethod}
                    </p>
                  )}
                  {service.contactInfo && (
                    <p className={styles.serviceContact}>
                      <span className={styles.label}>문의:</span> {service.contactInfo}
                    </p>
                  )}
                </div>
                <button className={styles.moreButton}>자세히 보기</button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noServicesContainer}>
            <p>이용 가능한 복지 서비스가 없습니다.</p>
            <button className={styles.retryButton} onClick={handleRetry}>다시 시도</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelfareServices;