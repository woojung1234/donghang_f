import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // 24시간 내 거부했으면 표시하지 않음
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: '#4A90E2',
      color: 'white',
      padding: '15px',
      borderRadius: '15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>🤖 금복이를 설치하세요!</div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>더 빠르고 편리하게 이용하세요</div>
      </div>
      <div>
        <button 
          onClick={handleInstall}
          style={{
            background: 'white',
            color: '#4A90E2',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            marginRight: '10px',
            fontWeight: 'bold'
          }}
        >
          설치
        </button>
        <button 
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '8px 16px',
            borderRadius: '8px'
          }}
        >
          나중에
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;