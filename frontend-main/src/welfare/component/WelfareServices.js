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
        console.log('복지 서비스 데이터 가져오기 시작');
        
        // 간소화된 API 경로 사용
        const apiUrl = '/api/welfare';
        
        console.log('API URL:', apiUrl);
        
        const response = await axios.get(apiUrl, {
          params: {
            page: 1,
            perPage: 20,
            // 필요에 따라 추가 파라미터 설정
          }
        });
        
        console.log('API 응답:', response);
        
        // API 응답 데이터 처리
        if (response.data && response.data.data) {
          console.log('복지 서비스 데이터 받음:', response.data.data);
          setServices(response.data.data);
        } else {
          console.log('데이터 없음 또는 형식 불일치:', response.data);
          setServices([]);
        }
        setLoading(false);
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
        
        // 임시 데이터로 테스트 (실제 API 연동 전 테스트용)
        setServices([
          {
            서비스명: '노인 돌봄 서비스',
            제공기관: '보건복지부',
            서비스설명: '독거노인 및 노인부부가구를 위한 돌봄 서비스를 제공합니다.',
            지원대상: '65세 이상 노인',
            신청방법: '주민센터 방문 신청',
            url: 'https://www.bokjiro.go.kr'
          },
          {
            서비스명: '노인 건강 검진',
            제공기관: '국민건강보험공단',
            서비스설명: '노인을 위한 무료 건강 검진 서비스를 제공합니다.',
            지원대상: '65세 이상 노인',
            신청방법: '건강보험공단 홈페이지 또는 방문 신청',
            url: 'https://www.nhis.or.kr'
          },
          {
            서비스명: '기초연금',
            제공기관: '국민연금공단',
            서비스설명: '노인의 안정적인 생활을 위한 기초연금을 지급합니다.',
            지원대상: '만 65세 이상, 소득인정액 기준 하위 70%',
            신청방법: '국민연금공단 또는 주민센터 방문 신청',
            url: 'https://www.nps.or.kr'
          }
        ]);
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
            <p className={styles.errorNote}>
              * 현재 임시 데이터를 표시하고 있습니다. API 연동 문제가 해결되면 실제 데이터로 대체됩니다.
            </p>
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