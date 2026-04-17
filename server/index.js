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

// Dynamic Bootstrap Logic
async function bootstrapWhatsApp() {
    addSystemLog('--- LOADER: Phase 1 (Dependencies) ---');
    try {
        const { Client, LocalAuth } = require('whatsapp-web.js');
        const QRCode = require('qrcode');
        const fs = require('fs');

        addSystemLog('--- LOADER: Phase 2 (Environment) ---');
        const isWin = process.platform === 'win32';
        const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || (isWin ? undefined : '/usr/bin/google-chrome-stable');

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

        client = new Client({
            // Path fix: Use local folder on windows, /tmp on linux
            authStrategy: new LocalAuth({ dataPath: isWin ? './.wwebjs_auth' : '/tmp/.wwebjs_auth' }),
            puppeteer: {
                executablePath: chromePath,
                headless: true,
                dumpio: true,
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
                    '--single-process',
                    '--disable-extensions',
                    '--remote-debugging-port=9222'
                ],
                timeout: 60000
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
            addSystemLog('SUCCESS: WhatsApp Bridge Connected!');
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
