const express = require('express');
const router = express.Router();
const OrderItem = require('../models/OrderItem');

// GET all
router.get('/', async (req, res) => {
    try {
        const orderItems = await OrderItem.findAll();
        res.json(orderItems);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання позицій замовлення' });
    }
});

// GET by id
router.get('/:id', async (req, res) => {
    try {
        const orderItem = await OrderItem.findByPk(req.params.id);

        if (!orderItem) {
            return res.status(404).json({ error: 'Позицію замовлення не знайдено' });
        }

        res.json(orderItem);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання позиції замовлення' });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const orderItem = await OrderItem.create({
            order_id: req.body.order_id,
            product_id: req.body.product_id,
            quantity: req.body.quantity,
            unit_price: req.body.unit_price
        });

        res.status(201).json(orderItem);
    } catch (error) {
        res.status(500).json({ error: 'Помилка створення позиції замовлення' });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const orderItem = await OrderItem.findByPk(req.params.id);

        if (!orderItem) {
            return res.status(404).json({ error: 'Позицію замовлення не знайдено' });
        }

        orderItem.order_id = req.body.order_id;
        orderItem.product_id = req.body.product_id;
        orderItem.quantity = req.body.quantity;
        orderItem.unit_price = req.body.unit_price;

        await orderItem.save();

        res.json(orderItem);
    } catch (error) {
        res.status(500).json({ error: 'Помилка оновлення позиції замовлення' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const orderItem = await OrderItem.findByPk(req.params.id);

        if (!orderItem) {
            return res.status(404).json({ error: 'Позицію замовлення не знайдено' });
        }

        await orderItem.destroy();
        res.json({ message: 'Позицію замовлення видалено' });
    } catch (error) {
        res.status(500).json({ error: 'Помилка видалення позиції замовлення' });
    }
});

module.exports = router;