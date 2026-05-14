const express = require('express');
const morgan = require('morgan');
const sequelize = require('./config/database');
const { logger } = require('./utils/logger');

// Моделі
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

// Routes
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const orderItemRoutes = require('./routes/orderItem.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('combined'));

// Логування часу обробки кожного запиту
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.info({
            message: 'HTTP request completed',
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            responseTime: `${duration}ms`
        });
    });

    next();
});

/* =========================
   ЗВ’ЯЗКИ МІЖ МОДЕЛЯМИ
========================= */

// Category -> Product
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// User -> Order
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

// Order -> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

// Product -> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

/* =========================
   ROUTES
========================= */

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/order-items', orderItemRoutes);
app.use('/', uploadRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Backend працює' });
});

// Моніторинг стану сервера
app.get('/status', (req, res) => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();

    res.json({
        status: 'OK',
        uptime,
        memoryUsage,
        cpuUsage
    });
});

// Глобальна обробка помилок
app.use((err, req, res, next) => {
    logger.error({
        message: err.message || 'Внутрішня помилка сервера',
        stack: err.stack,
        method: req.method,
        url: req.originalUrl
    });

    res.status(err.status || 500).json({
        message: err.message || 'Внутрішня помилка сервера'
    });
});

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await sequelize.authenticate();
        console.log('Підключення до MySQL успішне');
        logger.info('Підключення до MySQL успішне');

        await sequelize.sync({ alter: false });

        console.log('Моделі синхронізовано');
        logger.info('Моделі синхронізовано');

        app.listen(PORT, () => {
            console.log(`Сервер запущено на http://localhost:${PORT}`);
            logger.info(`Сервер запущено на http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Помилка запуску сервера:', error);
        logger.error({
            message: 'Помилка запуску сервера',
            error: error.message,
            stack: error.stack
        });
    }
}

start();
