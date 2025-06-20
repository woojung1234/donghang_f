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
        
        const response = await getPublicWelfareServices(page, perPage);
        
        console.log('API 응답:', response);
        
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
        
        if (err.response) {
          console.error('오류 응답:', err.response.data);
          console.error('오류 상태:', err.response.status);
          console.error('오류 헤더:', err.response.headers);
        } else if (err.request) {
          console.error('요청은 보냈으나 응답이 없음:', err.request);
        } else {
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

  const handleCallClick = (contactInfo, event) => {
    event.stopPropagation(); // 카드 클릭 이벤트 방지
    
    // 전화번호 추출 (간단한 패턴 매칭)
    const phoneMatch = contactInfo.match(/(\d{2,4}-\d{3,4}-\d{4})/);
    if (phoneMatch) {
      const phoneNumber = phoneMatch[1];
      // 실제로는 tel: 링크로 전화 걸기
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert(`문의처: ${contactInfo}`);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  // 서비스 설명을 짧게 자르는 함수
  const truncateDescription = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 서비스 유형에 따른 아이콘 반환
  const getServiceIcon = (serviceName) => {
    if (serviceName.includes('돌봄') || serviceName.includes('아이')) return '👶';
    if (serviceName.includes('사회') || serviceName.includes('심리')) return '💝';
    if (serviceName.includes('장애') || serviceName.includes('일자리')) return '💼';
    if (serviceName.includes('육아') || serviceName.includes('나눔')) return '🤱';
    return '🏥'; // 기본 아이콘
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>복지 서비스</h1>
        <p className={styles.subtitle}>필요한 서비스를 선택해주세요</p>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingText}>복지 서비스 정보를 불러오는 중...</div>
            <div className={styles.loadingSpinner}>⏳</div>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorText}>{error}</div>
            <button className={styles.retryButton} onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        ) : services.length > 0 ? (
          <div className={styles.servicesContainer}>
            {services.map((service, index) => (
              <div 
                key={service.serviceId || index} 
                className={styles.serviceCard}
                onClick={() => handleServiceClick(service.serviceUrl || service.website)}
              >
                {/* 서비스 아이콘과 제목 */}
                <div className={styles.serviceHeader}>
                  <div className={styles.serviceIcon}>
                    {getServiceIcon(service.serviceName)}
                  </div>
                  <h2 className={styles.serviceName}>{service.serviceName}</h2>
                </div>

                {/* 제공기관 */}
                <div className={styles.serviceProvider}>
                  <span className={styles.providerLabel}>제공기관:</span>
                  <span className={styles.providerName}>
                    {service.ministryName} {service.organizationName ? `(${service.organizationName})` : ''}
                  </span>
                </div>

                {/* 서비스 설명 */}
                <div className={styles.serviceDescription}>
                  {truncateDescription(service.serviceSummary, 60)}
                </div>

                {/* 연락처 정보 */}
                {service.contactInfo && (
                  <div className={styles.contactSection}>
                    <div className={styles.contactLabel}>📞 문의 전화</div>
                    <div className={styles.contactInfo}>{service.contactInfo}</div>
                  </div>
                )}

                {/* 버튼들 */}
                <div className={styles.buttonContainer}>
                  {service.contactInfo && (
                    <button 
                      className={styles.callButton}
                      onClick={(e) => handleCallClick(service.contactInfo, e)}
                    >
                      📞 전화하기
                    </button>
                  )}
                  <button className={styles.moreButton}>
                    📋 자세히 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noServicesContainer}>
            <div className={styles.noServicesIcon}>📋</div>
            <div className={styles.noServicesText}>이용 가능한 복지 서비스가 없습니다.</div>
            <button className={styles.retryButton} onClick={handleRetry}>
              다시 시도
            </button>
          </div>
        )}

        {/* 도움말 섹션 */}
        <div className={styles.helpSection}>
          <h3 className={styles.helpTitle}>💡 이용 방법</h3>
          <div className={styles.helpSteps}>
            <div className={styles.helpStep}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepText}>원하는 서비스를 선택하세요</span>
            </div>
            <div className={styles.helpStep}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepText}>"전화하기" 버튼을 눌러 상담받으세요</span>
            </div>
            <div className={styles.helpStep}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepText}>친절한 상담원이 도와드립니다</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelfareServices;