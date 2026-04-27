const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET all
router.get('/', async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання замовлень' });
    }
});

// GET by id
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Замовлення не знайдено' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання замовлення' });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const order = await Order.create({
            user_id: req.body.user_id,
            total_price: req.body.total_price,
            status: req.body.status
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Помилка створення замовлення' });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Замовлення не знайдено' });
        }

        order.user_id = req.body.user_id;
        order.total_price = req.body.total_price;
        order.status = req.body.status;

        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Помилка оновлення замовлення' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Замовлення не знайдено' });
        }

        await order.destroy();
        res.json({ message: 'Замовлення видалено' });
    } catch (error) {
        res.status(500).json({ error: 'Помилка видалення замовлення' });
    }
});

module.exports = router;