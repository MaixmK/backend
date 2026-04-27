const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// GET all
router.get('/', async (req, res) => {
    try {
        const products = await Product.findAll({
            include: Category
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання товарів' });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const product = await Product.create({
            category_id: req.body.category_id,
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            stock_count: req.body.stock_count,
            rating: req.body.rating
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Помилка створення товару' });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Товар не знайдено' });
        }

        product.category_id = req.body.category_id;
        product.name = req.body.name;
        product.description = req.body.description;
        product.price = req.body.price;
        product.stock_count = req.body.stock_count;
        product.rating = req.body.rating;

        await product.save();

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Помилка оновлення товару' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Товар не знайдено' });
        }

        await product.destroy();
        res.json({ message: 'Товар видалено' });
    } catch (error) {
        res.status(500).json({ error: 'Помилка видалення товару' });
    }
});

module.exports = router;