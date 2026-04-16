import React, { useState } from 'react';
import axios from 'axios';

const RegistrationCard = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    tcNo: '',
    birthDate: '',
    phone: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      alert("Lütfen KVKK metnini onaylayın.");
      return;
    }

    setLoading(true);
    try {
      // Backend'e gönderim
      const response = await axios.post('http://localhost:5000/api/register', formData);
      setMessage(response.data.message);
      // Eğitim amaçlı başarılı simülasyonu
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div className="reg-card">
        <div className="card-title-section">
          <div className="title">Bağlanılıyor...</div>
          <div className="subtitle">{message}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <div className="status-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
        </div>
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.5; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(0.95); opacity: 0.5; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="reg-card">
      <div className="card-title-section">
        <div className="title">Hoş Geldiniz</div>
        <div className="subtitle">
          Güvenli internet erişimi için lütfen<br />bilgilerinizi doğrulayın.
        </div>
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">AD SOYAD</label>
          <div className="input-wrapper">
            <input 
              type="text" 
              name="fullName"
              className="input-field" 
              placeholder="Adınız ve Soyadınız" 
              required
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">T.C. KIMLIK NO</label>
          <div className="input-wrapper">
            <input 
              type="text" 
              name="tcNo"
              className="input-field" 
              placeholder="11 Haneli Kimlik Numarası" 
              maxLength="11"
              required
              value={formData.tcNo}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">DOĞUM TARIHI</label>
          <div className="input-wrapper">
            <input 
              type="date" 
              name="birthDate"
              className="input-field" 
              required
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">TELEFON NUMARASI</label>
          <div className="input-wrapper">
            <input 
              type="tel" 
              name="phone"
              className="input-field" 
              placeholder="05XX XXX XX XX" 
              required
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="kvkk-section">
          <div 
            className={`checkbox-container ${agreed ? 'checked' : ''}`} 
            onClick={() => setAgreed(!agreed)}
          >
            {agreed && <div style={{ color: '#4D2600', textAlign: 'center', lineHeight: '20px', fontSize: '14px' }}>✓</div>}
          </div>
          <div className="kvkk-text">
            <a href="#" className="kvkk-link">KVKK Aydınlatma Metni</a>'ni okudum ve kabul ediyorum.
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'DOĞRULANIYOR...' : 'KAYIT OL VE BAĞLAN'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationCard;
