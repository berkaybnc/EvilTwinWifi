# 🛡️ Eğitim Amaçlı Güvenlik Uyarı Bildirimi (Disclaimer)

Bu proje (**Obsidian WiFi Registration Demo**), web güvenliği ve bilgi güvenliği dersleri için **Proof of Concept (PoC)** olarak geliştirilmiştir.

## ⚠️ Kritik Uyarılar

1.  **Etik Kullanım**: Bu araç sadece yasal sınırlar dahilinde, eğitim ortamlarında ve kendi cihazlarınız üzerinde test amaçlı kullanılmalıdır. Başkalarının verilerini izinsiz toplamak veya aldatıcı yöntemlerle erişim sağlamak suç teşkil eder.
2.  **Veri Gizliliği**: Bu demo, girilen verileri **şifrelemeden** yerel bir dosyaya kaydeder. Gerçek dünyada bu tür sistemler asla bu şekilde kurgulanmamalıdır.
3.  **Hukuki Sorumluluk**: Bu yazılımın kötü amaçlı kullanımından doğacak hiçbir sorumluluk kabul edilmez. Sorumluluk tamamen kullanıcıya aittir.

## 🎓 Ne Öğreniyoruz?

Bu demo üzerinden şu güvenlik açıklarını tartışabiliriz:

*   **Evil Twin Saldırıları**: Bir saldırganın meşru görünen bir WiFi ağı taklit ederek kullanıcıları nasıl tuzağa düşürebileceği.
*   **Sosyal Mühendislik**: Görsel tasarımın (premium görünüm, kilit ikonları, AES-256 ibareleri) kullanıcı üzerindeki güven oluşturma etkisi.
*   **Hassas Veri Talebi**: WiFi girişi için T.C. Kimlik No gibi ilgisiz ve aşırı hassas bilgilerin talep edilmesinin bir "red flag" (tehlike işareti) olduğu.

## 🛡️ Nasıl Korunuruz?

1.  **Halka Açık WiFi Riskleri**: Şifresiz veya bilinmeyen ağlarda asla kişisel bilgilerinizi girmeyin.
2.  **VPN Kullanımı**: Güvenilir bir VPN kullanarak tüm trafiğinizi şifreleyin.
3.  **HTTPS ve Sertifikalar**: Tarayıcının adres barındaki uyarıları dikkate alın.
4.  **Kurumsal Çözümler**: Gerçek Captive Portallar genellikle SMS doğrulama veya güvenli kimlik sağlayıcılar (OAuth) kullanır.
