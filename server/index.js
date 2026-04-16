// --- V7 DEFINITIVE BOOTSTRAP ---
// THIS VERSION MINIMIZES STARTUP TIME TO ENSURE CLOUD RUN HEALTH CHECKS PASS
console.log('--- SYSTEM: INITIALIZING V7 BOOT SEQUENCE ---');

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Global State
let connectionStatus = 'BOOTING';
let latestQR = null;
let systemLogs = [];
let client = null;

const addSystemLog = (msg) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    systemLogs.push(entry);
    if (systemLogs.length > 100) systemLogs.shift();
};

addSystemLog('V7 Server starting up...');
addSystemLog(`Target Port: ${PORT}`);

app.use(cors());
app.use(express.json());

// 1. FORCED PORT BINDING (First priority)
// We add a dedicated health check that requires ZERO dependencies
app.get('/health', (req, res) => {
    res.status(200).send('V7_HEALTHY_AND_READY');
});

app.get('/api/admin/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: latestQR,
        logs: [], // Victim logs can be added later
        systemLogs: systemLogs
    });
});

app.post('/api/admin/restart', (req, res) => {
    addSystemLog('Restart requested via API.');
    startWhatsApp();
    res.json({ status: 'success', message: 'Initialization triggered.' });
});

// Dynamic Loader
async function startWhatsApp() {
    addSystemLog('--- STARTING WHATSAPP DIAGNOSTICS ---');
    try {
        addSystemLog('Loading Heavy Dependencies...');
        const { Client, LocalAuth } = require('whatsapp-web.js');
        const QRCode = require('qrcode');
        const fs = require('fs');
        
        addSystemLog('Dependencies Loaded. Checking Environment...');
        const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
        addSystemLog(`Chrome Bin: ${chromePath} (exists: ${fs.existsSync(chromePath)})`);

        if (client) {
            addSystemLog('Cleaning up old client...');
            await client.destroy().catch(() => {});
        }

        connectionStatus = 'INITIALIZING';
        addSystemLog('Creating WhatsApp Client...');
        
        client = new Client({
            authStrategy: new LocalAuth({ dataPath: '/tmp/.wwebjs_auth' }),
            puppeteer: {
                executablePath: chromePath,
                headless: true,
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox', 
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote'
                ]
            }
        });

        client.on('qr', async (qr) => {
            connectionStatus = 'QR_REQUIRED';
            addSystemLog('Standard QR code generated.');
            latestQR = await QRCode.toDataURL(qr);
        });

        client.on('ready', () => {
            connectionStatus = 'READY';
            latestQR = null;
            addSystemLog('SUCCESS: WhatsApp Connection Established!');
        });

        client.on('disconnected', (reason) => {
            connectionStatus = 'DISCONNECTED';
            addSystemLog(`WARNING: Disconnected because ${reason}`);
        });

        addSystemLog('Calling client.initialize()...');
        await client.initialize();

    } catch (err) {
        addSystemLog(`CRITICAL ERROR DURING INIT: ${err.message}`);
        connectionStatus = 'ERROR';
    }
}

// Serve Frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// THE SURVIVAL BINDING
app.listen(PORT, '0.0.0.0', () => {
    addSystemLog(`SYSTEM: Listening on port ${PORT}. Health check ready.`);
    connectionStatus = 'SERVER_UP';
    
    // DELAYED HEAVY START: Allow 10s for Cloud Run to register health check success
    addSystemLog('SYSTEM: Waiting 10s for environment stabilization...');
    setTimeout(startWhatsApp, 10000);
});
