const express = require('express');
const { Op } = require('sequelize');

const router = express.Router();

const Product = require('../models/Product');
const Category = require('../models/Category');

const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const {
    validateProductId,
    validateProductQuery,
    validateProductBody
} = require('../middleware/productValidation.middleware');

const {
    getCache,
    setCache,
    delCacheByPrefix
} = require('../utils/cache');

/*
    GET /products

    Оптимізований маршрут:
    - пагінація через page/limit;
    - фільтрація за ціною, категорією та пошуком;
    - сортування;
    - вибір потрібних полів;
    - підключення категорії товару;
    - кешування результатів.
*/
router.get('/', validateProductQuery, validate, async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);
        const offset = (page - 1) * limit;

        const sortBy = req.query.sortBy || 'id';
        const sortOrder = String(req.query.sortOrder || 'ASC').toUpperCase();

        const where = {};

        if (req.query.category_id) {
            where.category_id = Number(req.query.category_id);
        }

        if (req.query.minPrice || req.query.maxPrice) {
            where.price = {};

            if (req.query.minPrice) {
                where.price[Op.gte] = Number(req.query.minPrice);
            }

            if (req.query.maxPrice) {
                where.price[Op.lte] = Number(req.query.maxPrice);
            }
        }

        if (req.query.search) {
            where.name = {
                [Op.like]: `%${req.query.search}%`
            };
        }

        const cacheKey = `products:${JSON.stringify(req.query)}`;
        const cachedProducts = await getCache(cacheKey);

        if (cachedProducts) {
            return res.json({
                ...cachedProducts,
                source: 'cache'
            });
        }

        const result = await Product.findAndCountAll({
            where,
            attributes: [
                'id',
                'category_id',
                'name',
                'description',
                'price',
                'stock_count',
                'rating'
            ],
            include: [
                {
                    model: Category,
                    attributes: ['id', 'name']
                }
            ],
            order: [[sortBy, sortOrder]],
            limit,
            offset
        });

        const products = result.rows.map((product) => product.toJSON());

        const response = {
            source: 'database',
            page,
            limit,
            total: result.count,
            totalPages: Math.ceil(result.count / limit),
            data: products
        };

        await setCache(cacheKey, response);

        return res.json(response);
    } catch (error) {
        console.error('Помилка GET /products:', error);

        return res.status(500).json({
            error: 'Помилка отримання товарів',
            details: error.message
        });
    }
});

/*
    GET /products/:id
*/
router.get('/:id', validateProductId, validate, async (req, res) => {
    try {
        const cacheKey = `products:id:${req.params.id}`;
        const cachedProduct = await getCache(cacheKey);

        if (cachedProduct) {
            return res.json({
                source: 'cache',
                data: cachedProduct
            });
        }

        const product = await Product.findByPk(req.params.id, {
            attributes: [
                'id',
                'category_id',
                'name',
                'description',
                'price',
                'stock_count',
                'rating'
            ],
            include: [
                {
                    model: Category,
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!product) {
            return res.status(404).json({
                error: 'Товар не знайдено'
            });
        }

        const productJson = product.toJSON();

        await setCache(cacheKey, productJson);

        return res.json({
            source: 'database',
            data: productJson
        });
    } catch (error) {
        console.error('Помилка GET /products/:id:', error);

        return res.status(500).json({
            error: 'Помилка отримання товару',
            details: error.message
        });
    }
});

/*
    POST /products
    Доступний тільки адміністратору.
*/
router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin'),
    validateProductBody,
    validate,
    async (req, res) => {
        try {
            const product = await Product.create({
                category_id: req.body.category_id,
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                stock_count: req.body.stock_count,
                rating: req.body.rating || 0
            });

            await delCacheByPrefix('products:');

            return res.status(201).json(product.toJSON());
        } catch (error) {
            console.error('Помилка POST /products:', error);

            return res.status(500).json({
                error: 'Помилка створення товару',
                details: error.message
            });
        }
    }
);

/*
    PUT /products/:id
    Доступний тільки адміністратору.
*/
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    validateProductId,
    validateProductBody,
    validate,
    async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id);

            if (!product) {
                return res.status(404).json({
                    error: 'Товар не знайдено'
                });
            }

            product.category_id = req.body.category_id;
            product.name = req.body.name;
            product.description = req.body.description;
            product.price = req.body.price;
            product.stock_count = req.body.stock_count;
            product.rating = req.body.rating || 0;

            await product.save();
            await delCacheByPrefix('products:');

            return res.json(product.toJSON());
        } catch (error) {
            console.error('Помилка PUT /products/:id:', error);

            return res.status(500).json({
                error: 'Помилка оновлення товару',
                details: error.message
            });
        }
    }
);

/*
    DELETE /products/:id
    Доступний тільки адміністратору.
*/
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    validateProductId,
    validate,
    async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id);

            if (!product) {
                return res.status(404).json({
                    error: 'Товар не знайдено'
                });
            }

            await product.destroy();
            await delCacheByPrefix('products:');

            return res.json({
                message: 'Товар видалено'
            });
        } catch (error) {
            console.error('Помилка DELETE /products/:id:', error);

            return res.status(500).json({
                error: 'Помилка видалення товару',
                details: error.message
            });
        }
    }
);

module.exports = router;