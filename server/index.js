const express = require('express');
const path = require('path');
const cors = require('cors');

// GLOBAL STATE
let connectionStatus = 'SERVER_UP';
let latestQR = null;
let systemLogs = [];
let client = null; // Will be loaded dynamically

const addSystemLog = (msg) => {
    const logEntry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(logEntry);
    systemLogs.push(logEntry);
    if (systemLogs.length > 50) systemLogs.shift();
};

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(cors());
app.use(express.json());

// 1. IMMEDIATE HEALTH CHECK
app.get('/health', (req, res) => res.status(200).send('OK'));

// 2. ADMIN STATUS
app.get('/api/admin/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: latestQR,
        logs: [], // Fallback for now
        systemLogs: systemLogs
    });
});

// 3. DYNAMIC INITIALIZATION LOGIC
const initWhatsApp = async () => {
    addSystemLog('Starting dynamic library loading...');
    try {
        // Dynamic requires to prevent startup crash
        const { Client, LocalAuth } = require('whatsapp-web.js');
        const QRCode = require('qrcode');
        const fs = require('fs');

        addSystemLog('Libraries loaded successfully.');

        if (client) {
            addSystemLog('Destroying old client instance...');
            await client.destroy().catch(e => addSystemLog(`Destroy error: ${e.message}`));
        }

        const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
        addSystemLog(`Using Chrome at: ${chromePath}`);

        client = new Client({
            authStrategy: new LocalAuth({ dataPath: '/tmp/.wwebjs_auth' }),
            puppeteer: {
                executablePath: chromePath,
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-zygote']
            }
        });

        client.on('qr', async (qr) => {
            connectionStatus = 'QR_REQUIRED';
            addSystemLog('QR code received.');
            latestQR = await QRCode.toDataURL(qr);
        });

        client.on('ready', () => {
            connectionStatus = 'READY';
            latestQR = null;
            addSystemLog('WhatsApp is READY!');
        });

        client.on('disconnected', () => {
            connectionStatus = 'DISCONNECTED';
            addSystemLog('WhatsApp disconnected.');
        });

        connectionStatus = 'INITIALIZING';
        addSystemLog('Initializing WhatsApp client...');
        await client.initialize();

    } catch (err) {
        addSystemLog(`CRITICAL FATAL ERROR: ${err.message}`);
        connectionStatus = 'ERROR';
    }
};

app.post('/api/admin/restart', (req, res) => {
    addSystemLog('Manual restart requested.');
    initWhatsApp();
    res.json({ status: 'success' });
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// START SERVER IMMEDIATELY
app.listen(PORT, '0.0.0.0', () => {
    addSystemLog(`SURVIVOR SERVER: Listening on port ${PORT}`);
    addSystemLog('WAITING 15s before lazy loading WhatsApp...');
    setTimeout(initWhatsApp, 15000);
});
