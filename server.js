const express = require('express');
const sequelize = require('./config/database');

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

const app = express();

// Middleware
app.use(express.json());

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



app.get('/', (req, res) => {
    res.json({ message: 'Backend працює' });
});



app.use((err, req, res, next) => {
    console.error('Глобальна помилка:', err);
    res.status(500).json({ message: 'Внутрішня помилка сервера' });
});



const PORT = 3000;

async function start() {
    try {
        await sequelize.authenticate();
        console.log('Підключення до MySQL успішне');

        await sequelize.sync({ alter: false });

        console.log('Моделі синхронізовано');

        app.listen(PORT, () => {
            console.log(`Сервер запущено на http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Помилка запуску сервера:', error);
    }
}

start();