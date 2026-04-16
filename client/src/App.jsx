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
          <div style={{ width: '24px', height: '17px', backgroundColor: '#F97316', WebkitMask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 3C7.79 3 3.97 4.51 1 7l2 2.5C5.1 7.62 8.35 6.5 12 6.5s6.9 1.12 9 3L23 7c-2.97-2.49-6.79-4-11-4zm0 5c-3.06 0-5.81 1.09-8 2.87L6 13.5c1.71-1.35 3.86-2.13 6-2.13s4.29.78 6 2.13l2-2.63C17.81 9.09 15.06 8 12 8zm0 5c-1.9 0-3.64.67-5 1.77L12 21l11-14C20.36 5.67 18.64 5 16.74 5L12 13z\'/%3E%3C/svg%3E") no-repeat center', mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 3C7.79 3 3.97 4.51 1 7l2 2.5C5.1 7.62 8.35 6.5 12 6.5s6.9 1.12 9 3L23 7c-2.97-2.49-6.79-4-11-4zm0 5c-3.06 0-5.81 1.09-8 2.87L6 13.5c1.71-1.35 3.86-2.13 6-2.13s4.29.78 6 2.13l2-2.63C17.81 9.09 15.06 8 12 8zm0 5c-1.9 0-3.64.67-5 1.77L12 21l11-14C20.36 5.67 18.64 5 16.74 5L12 13z\'/%3E%3C/svg%3E") no-repeat center' }}></div>
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
