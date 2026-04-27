const fs = require('fs');
const path = require('path');

const logError = (message, error) => {
    const logMessage = `[${new Date().toISOString()}] ${message}: ${error}\n`;

    console.error(logMessage);

    const logPath = path.join(__dirname, '../error.log');
    fs.appendFileSync(logPath, logMessage, 'utf8');
};

module.exports = { logError };