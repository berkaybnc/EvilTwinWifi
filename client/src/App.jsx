import React from 'react';
import RegistrationCard from './components/RegistrationCard';

function App() {
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <div className="logo-circle">
            <div className="logo-inner"></div>
          </div>
          <div className="logo-text">OBSIDIAN</div>
        </div>
        <div className="status-badge">
          <div className="status-dot"></div>
          <div className="status-text">NETWORK SECURE</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="blur-orange"></div>
        <div className="blur-blue"></div>
        
        <RegistrationCard />

        {/* Security Info */}
        <div className="security-badges">
          <div className="badge-item">
            <div className="badge-icon"></div>
            <div className="badge-text">AES-256</div>
          </div>
          <div className="badge-item">
            <div className="badge-icon" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)' }}></div>
            <div className="badge-text">HIGH SPEED</div>
          </div>
          <div className="badge-item">
            <div className="badge-icon"></div>
            <div className="badge-text">IDENTITY VERIFIED</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#" className="footer-link">PRIVACY POLICY</a>
          <a href="#" className="footer-link">TERMS OF SERVICE</a>
        </div>
        <div className="copyright">© 2026 OBSIDIAN CONDUIT. ALL RIGHTS RESERVED.</div>
      </footer>
    </div>
  );
}

export default App;
