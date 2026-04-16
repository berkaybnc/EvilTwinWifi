# Obsidian WiFi Registration Demo (Educational PoC)

Bu proje, Bilgi Güvenliği dersi kapsamında Evil Twin saldırılarını ve oltalama (phishing) tekniklerini simüle etmek için geliştirilmiş bir eğitim aracıdır.

## 🚀 Kurulum

### 1. Backend (Server) Setup
```bash
cd server
npm install
node index.js
```
Sunucu `http://localhost:5000` adresinde çalışacaktır.

### 2. Frontend (Client) Setup
```bash
cd client
npm install
npm run dev
```
Arayüz `http://localhost:5173` (veya Vite'ın atadığı port) üzerinden erişilebilir olacaktır.

## 📂 Proje Yapısı

*   `/client`: Vite + React tabanlı premium "Obsidian" arayüzü.
*   `/server`: Express tabanlı veriyi `logs/captured_data.json` dosyasına kaydeden sunucu.
*   `DISCLAIMER.md`: Güvenlik uyarıları ve eğitim notları.

## 🎓 Eğitim Senaryosu

1.  Kullanıcı sahte ağa bağlanır.
2.  Obsidian kayıt sayfası karşısına çıkar.
3.  Tasarımın profesyonelliği ve "Secure" ibareleri sayesinde kullanıcı bilgilerini girer.
4.  Bilgiler sunucuda loglanır ve kullanıcıya "Bağlanılıyor" mesajı gösterilir.

**Önemli**: Bu proje sadece demo amaçlıdır.
