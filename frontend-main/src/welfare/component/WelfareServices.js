import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from 'header/BlueHeader';
import styles from 'welfare/css/WelfareServices.module.css';

function WelfareServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWelfareServices = async () => {
      try {
        // 공공 API 호출 (프록시 설정으로 자동으로 API 키가 적용됨)
        const response = await axios.get('/15083323/v1/uddi:48d6c839-ce02-4546-901e-e9ad9bae8e0d', {
          params: {
            page: 1,
            perPage: 20,
            // 필요한 경우 추가 매개변수도 여기에 설정
          }
        });
        
        // API 응답 데이터 처리
        if (response.data && response.data.data) {
          setServices(response.data.data);
        } else {
          setServices([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('복지 서비스 데이터를 가져오는 중 오류가 발생했습니다:', err);
        setError('복지 서비스 데이터를 가져오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchWelfareServices();
  }, []);

  const handleServiceClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('연결된 URL이 없습니다.');
    }
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
          </div>
        ) : services.length > 0 ? (
          <div className={styles.servicesContainer}>
            {services.map((service, index) => (
              <div 
                key={index} 
                className={styles.serviceCard}
                onClick={() => handleServiceClick(service.url)}
              >
                <h2 className={styles.serviceName}>{service.서비스명}</h2>
                <p className={styles.serviceProvider}>{service.제공기관}</p>
                <p className={styles.serviceDescription}>{service.서비스설명}</p>
                <div className={styles.serviceDetails}>
                  {service.지원대상 && (
                    <p className={styles.serviceTarget}>
                      <span className={styles.label}>지원대상:</span> {service.지원대상}
                    </p>
                  )}
                  {service.신청방법 && (
                    <p className={styles.serviceApplication}>
                      <span className={styles.label}>신청방법:</span> {service.신청방법}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default WelfareServices;