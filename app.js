const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
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

/* =========================
   БЕЗПЕКА ТА ПРОДУКТИВНІСТЬ
========================= */
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        return res.status(429).json({
            message: 'Забагато запитів з цієї IP-адреси. Спробуйте пізніше.'
        });
    }
});

app.use(apiLimiter);
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
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

/* =========================
   ROUTES
========================= */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/order-items', orderItemRoutes);
app.use('/', uploadRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Backend працює' });
});

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

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Файл перевищує дозволений розмір 5 MB' });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Внутрішня помилка сервера'
    });
});

app.use((err, req, res, next) => {
    console.error('Помилка сервера:', err);

    res.status(err.status || 500).json({
        message: err.message || 'Внутрішня помилка сервера'
    });
});

module.exports = app;
