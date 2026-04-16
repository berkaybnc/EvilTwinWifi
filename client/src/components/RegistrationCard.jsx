import React, { useState } from 'react';
import axios from 'axios';

const RegistrationCard = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    tcNo: '',
    birthDate: '',
    phone: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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
      await axios.post('http://localhost:5000/api/register', formData);
      // Yerel popup'ı göster
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? 'İŞLENİYOR...' : 'KAYIT OL VE BAĞLAN'}
        </button>
      </form>

      {/* --- CUSTOM SUCCESS POPUP --- */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="reg-card" style={{ width: '320px', textAlign: 'center', padding: '32px', boxShadow: '0 0 50px rgba(249, 115, 22, 0.2)' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#F97316', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', color: '#131313' }}>✓</span>
            </div>
            <div className="title" style={{ fontSize: '20px', marginBottom: '8px' }}>Başarılı</div>
            <div className="subtitle" style={{ marginBottom: '24px' }}>Kayıt işleminiz başarıyla tamamlanmıştır.</div>
            <button 
              className="submit-btn" 
              onClick={() => onSuccess(formData.phone)}
              style={{ padding: '12px' }}
            >
              TAMAM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationCard;
