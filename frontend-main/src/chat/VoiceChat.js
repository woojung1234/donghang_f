  // AI 서버 연결 상태 확인
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const AI_SERVICE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:9090';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${AI_SERVICE_URL}/health`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (response.ok) {
          setServerConnected(true);
          setError(null);
        } else {
          setServerConnected(false);
          setError("AI 서버에 연결할 수 없습니다. 오프라인 모드로 전환합니다.");
        }
      } catch (err) {
        console.warn("AI 서버 연결 확인 실패:", err);
        setServerConnected(false);
        setError("AI 서버에 연결할 수 없습니다. 오프라인 모드로 전환합니다.");
      }
    };
    
    checkServerConnection();
  }, []);