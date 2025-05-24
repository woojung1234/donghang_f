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
        } else {
          console.log('데이터 없음 또는 형식 불일치:', response);
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
            서비스아이디: 'WF0001',
            서비스명: '노인 돌봄 서비스',
            서비스요약: '독거노인 및 노인부부가구를 위한 돌봄 서비스를 제공합니다.',
            소관부처명: '보건복지부',
            소관조직명: '노인정책과',
            대표문의: '129',
            지원대상: '65세 이상 노인',
            신청방법: '주민센터 방문 신청',
            서비스URL: 'https://www.bokjiro.go.kr'
          },
          {
            서비스아이디: 'WF0002',
            서비스명: '노인 건강 검진',
            서비스요약: '노인을 위한 무료 건강 검진 서비스를 제공합니다.',
            소관부처명: '보건복지부',
            소관조직명: '건강정책과',
            대표문의: '1577-1000',
            지원대상: '65세 이상 노인',
            신청방법: '건강보험공단 홈페이지 또는 방문 신청',
            서비스URL: 'https://www.nhis.or.kr'
          },
          {
            서비스아이디: 'WF0003',
            서비스명: '기초연금',
            서비스요약: '노인의 안정적인 생활을 위한 기초연금을 지급합니다.',
            소관부처명: '보건복지부',
            소관조직명: '국민연금공단',
            대표문의: '1355',
            지원대상: '만 65세 이상, 소득인정액 기준 하위 70%',
            신청방법: '국민연금공단 또는 주민센터 방문 신청',
            서비스URL: 'https://www.nps.or.kr'
          }
        ]);
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
                key={service.서비스아이디 || index} 
                className={styles.serviceCard}
                onClick={() => handleServiceClick(service.서비스URL)}
              >
                <h2 className={styles.serviceName}>{service.서비스명}</h2>
                <p className={styles.serviceProvider}>{service.소관부처명} {service.소관조직명 ? `(${service.소관조직명})` : ''}</p>
                <p className={styles.serviceDescription}>{service.서비스요약}</p>
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
                  {service.대표문의 && (
                    <p className={styles.serviceContact}>
                      <span className={styles.label}>문의:</span> {service.대표문의}
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