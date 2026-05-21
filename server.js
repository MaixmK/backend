require('dotenv').config();
const sequelize = require('./config/database');
const app = require('./app');
const { logger } = require('./utils/logger');
const { connectRedis, disconnectRedis } = require('./utils/cache');

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await sequelize.authenticate();
        console.log('Підключення до MySQL успішне');
        logger.info('Підключення до MySQL успішне');

        await sequelize.sync({ alter: false });
        console.log('Моделі синхронізовано');
        logger.info('Моделі синхронізовано');

        await connectRedis();

        app.listen(PORT, () => {
            console.log(`Сервер запущено на http://localhost:${PORT}`);
            console.log(`Swagger документація: http://localhost:${PORT}/api-docs`);
            logger.info(`Сервер запущено на http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Помилка запуску сервера:', error);
        logger.error({
            message: 'Помилка запуску сервера',
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    await disconnectRedis();
    process.exit(0);
});

start();
