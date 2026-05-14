const winston = require('winston');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ filename: 'app.log' }),
        new winston.transports.File({ filename: 'error.log', level: 'error' })
    ]
});

const logError = (message, error) => {
    logger.error({
        message,
        error: error?.message || error,
        stack: error?.stack
    });
};

module.exports = { logger, logError };
