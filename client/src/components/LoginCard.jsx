import React, { useState } from 'react';
import axios from 'axios';

const LoginCard = () => {
  const [formData, setFormData] = useState({
    phone: '',
    smsCode: ''
  });
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Eğitim amaçlı kod isteme isteği
      await axios.post('http://10.54.117.76:5000/api/request-code', { phone: formData.phone });
      setStep('verify');
    } catch (error) {
      console.error("Hata:", error);
      const errorMsg = error.response?.data?.message || "Kod gönderilirken bir hata oluştu.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://10.54.117.76:5000/api/login', formData);
      setMessage("Hotspot ağına başarıyla bağlandınız. Yönlendiriliyorsunuz...");
    } catch (error) {
      console.error("Hata:", error);
      const errorMsg = error.response?.data?.message || "Giriş sırasında bir hata oluştu.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div className="reg-card">
        <div className="card-title-section">
          <div className="title" style={{ color: '#F97316' }}>Bağlantı Başarılı</div>
          <div className="subtitle">{message}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <div className="status-dot" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F97316', animation: 'pulse 1.5s infinite', boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-card" style={{ gap: '32px' }}>
      <div className="card-title-section">
        <div className="title">Hoş Geldiniz</div>
        <div className="subtitle">
          İnternet dünyasına güvenli bir geçiş<br />yapmak için bilgilerinizi girin.
        </div>
      </div>

      <form className="form-body" style={{ paddingTop: '8px' }} onSubmit={step === 'request' ? handleRequestCode : handleSubmit}>
        <div className="input-group" style={{ height: '79px', position: 'relative' }}>
          <label className="input-label" style={{ paddingLeft: '4px' }}>TELEFON NUMARASI</label>
          <div className="input-wrapper" style={{ marginTop: '8px' }}>
            <div className="input-icon" style={{ backgroundColor: '#737373', WebkitMask: 'url("https://www.svgrepo.com/show/349474/phone.svg") no-repeat center', mask: 'url("https://www.svgrepo.com/show/349474/phone.svg") no-repeat center' }}></div>
            <input 
              type="tel" 
              name="phone"
              className="input-field input-with-icon" 
              placeholder="0 (5xx) xxx xx xx" 
              required
              disabled={step === 'verify'}
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {step === 'verify' && (
          <div className="input-group" style={{ height: '99px', position: 'relative', animation: 'fadeIn 0.3s ease' }}>
            <label className="input-label" style={{ paddingLeft: '4px' }}>6 HANELI SMS KODU</label>
            <div className="input-wrapper" style={{ marginTop: '8px' }}>
              <div className="input-icon" style={{ backgroundColor: '#737373', WebkitMask: 'url("https://www.svgrepo.com/show/512411/lock.svg") no-repeat center', mask: 'url("https://www.svgrepo.com/show/512411/lock.svg") no-repeat center' }}></div>
              <input 
                type="text" 
                name="smsCode"
                className="input-field input-with-icon sms-input" 
                placeholder="······" 
                maxLength="6"
                required
                autoFocus
                value={formData.smsCode}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <button type="submit" className="submit-btn" style={{ marginTop: '16px' }} disabled={loading}>
          {loading ? 'İŞLEM YAPILIYOR...' : (step === 'request' ? 'KOD İSTE' : 'Giriş Yap')}
          {!loading && <div style={{ width: '8px', height: '12px', backgroundColor: '#4D2600', WebkitMask: 'url("https://www.svgrepo.com/show/522513/chevron-right.svg") no-repeat center', mask: 'url("https://www.svgrepo.com/show/522513/chevron-right.svg") no-repeat center' }}></div>}
        </button>
      </form>

      <div className="divider">
        <span className="resend-text">{step === 'verify' ? 'Kod gelmedi mi?' : 'Yardıma mı ihtiyacınız var?'} </span>
        <span className="resend-link" onClick={() => step === 'verify' && setStep('request')}>
          {step === 'verify' ? 'Yeniden Gönder' : 'Destek Al'}
        </span>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginCard;
