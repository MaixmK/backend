const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET all
router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Помилка отримання категорій' });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const category = await Category.create({
            name: req.body.name
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Помилка створення категорії' });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ error: 'Категорію не знайдено' });
        }

        category.name = req.body.name;
        await category.save();

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Помилка оновлення категорії' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ error: 'Категорію не знайдено' });
        }

        await category.destroy();
        res.json({ message: 'Категорію видалено' });
    } catch (error) {
        res.status(500).json({ error: 'Помилка видалення категорії' });
    }
});

module.exports = router;