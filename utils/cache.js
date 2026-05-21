const NodeCache = require('node-cache');
const { createClient } = require('redis');
const { logger } = require('./logger');

const memoryCache = new NodeCache({ stdTTL: Number(process.env.CACHE_TTL || 60) });
let redisClient = null;
let redisReady = false;

async function connectRedis() {
    if (process.env.REDIS_ENABLED !== 'true') {
        logger.info('Redis вимкнено. Використовується in-memory cache.');
        return null;
    }

    redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (error) => {
        redisReady = false;
        logger.error({ message: 'Redis error', error: error.message });
    });

    try {
        await redisClient.connect();
        redisReady = true;
        logger.info('Redis підключено успішно');
    } catch (error) {
        redisReady = false;
        logger.error({ message: 'Не вдалося підключити Redis. Використовується in-memory cache.', error: error.message });
    }

    return redisClient;
}

async function getCache(key) {
    if (redisReady && redisClient) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }

    return memoryCache.get(key) || null;
}

async function setCache(key, value, ttl = Number(process.env.CACHE_TTL || 60)) {
    if (redisReady && redisClient) {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        return;
    }

    memoryCache.set(key, value, ttl);
}

async function delCacheByPrefix(prefix) {
    if (redisReady && redisClient) {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length) {
            await redisClient.del(keys);
        }
        return;
    }

    memoryCache.keys()
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => memoryCache.del(key));
}

async function disconnectRedis() {
    if (redisReady && redisClient) {
        await redisClient.quit();
    }
}

module.exports = {
    connectRedis,
    disconnectRedis,
    getCache,
    setCache,
    delCacheByPrefix
};
