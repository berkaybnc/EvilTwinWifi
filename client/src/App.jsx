import React, { useState, useEffect } from 'react';
import RegistrationCard from './components/RegistrationCard';
import LoginCard from './components/LoginCard';
import AdminPanel from './components/AdminPanel';

function App() {
  const [view, setView] = useState('register'); // 'register', 'login', or 'admin'

  useEffect(() => {
    // URL kontrolü ile gizli admin paneline erişim (slash toleransı eklendi)
    if (window.location.pathname.startsWith('/admin')) {
      setView('admin');
    }
  }, []);

  const handleRegisterSuccess = (phone) => {
    setView('login');
  };

  if (view === 'admin') {
    return (
      <div className="app-container" style={{ maxWidth: '1200px' }}>
        <AdminPanel />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <div className="logo-circle" style={{ outline: '2px solid #F97316', border: 'none' }}>
            <div className="logo-inner" style={{ width: '8px', height: '8px', backgroundColor: '#F97316', boxShadow: 'none' }}></div>
          </div>
          <div className="logo-text" style={{ fontSize: '20px', letterSpacing: '2px' }}>OBSIDIAN</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="status-badge" style={{ backgroundColor: '#1F1F1F', padding: '6px 12px' }}>
            <div className="status-dot"></div>
            <div className="status-text" style={{ color: '#DDC1AE', fontSize: '10px' }}>GUEST-NETWORK</div>
          </div>
          <div style={{ width: '24px', height: '17px', backgroundColor: '#F97316', WebkitMask: 'url("https://www.svgrepo.com/show/532381/wifi-signal-strong.svg") no-repeat center', mask: 'url("https://www.svgrepo.com/show/532381/wifi-signal-strong.svg") no-repeat center' }}></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ paddingTop: '89px' }}>
        <div className="blur-orange"></div>
        <div className="blur-blue" style={{ left: '150px', top: '293px', backgroundColor: 'rgba(133, 207, 255, 0.05)' }}></div>
        
        {view === 'register' ? (
          <RegistrationCard onSuccess={handleRegisterSuccess} />
        ) : (
          <LoginCard />
        )}

        {/* Security and Support Info */}
        <div className="security-badges-row">
          <div className="security-badge-item">
            <div className="badge-icon-bg">
              <div className="badge-icon-blue"></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="badge-title">GÜVENLI BAĞLANTI</div>
              <div className="badge-subtitle">256-bit SSL şifreleme aktif</div>
            </div>
          </div>
          <div className="support-section">
            <div className="support-title">DESTEK HATTI</div>
            <div className="support-number">+90 850 000 00 00</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#" className="footer-link">PRIVACY POLICY</a>
          <a href="#" className="footer-link">TERMS OF SERVICE</a>
        </div>
        <div 
          className="copyright" 
          onDoubleClick={() => setView('admin')} 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Admin Access"
        >
          © 2026 OBSIDIAN CONDUIT. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}

export default App;
