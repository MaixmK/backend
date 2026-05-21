const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PC Components Store API',
            version: '1.0.0',
            description: 'Документація REST API для лабораторної роботи №5'
        },
        servers: [
            { url: 'http://localhost:3000' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        paths: {
            '/products': {
                get: {
                    summary: 'Отримати товари з пагінацією, фільтрацією та кешуванням',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', example: 10 } },
                        { name: 'search', in: 'query', schema: { type: 'string', example: 'RTX' } },
                        { name: 'minPrice', in: 'query', schema: { type: 'number', example: 1000 } },
                        { name: 'maxPrice', in: 'query', schema: { type: 'number', example: 50000 } },
                        { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'price' } },
                        { name: 'sortOrder', in: 'query', schema: { type: 'string', example: 'DESC' } }
                    ],
                    responses: {
                        200: { description: 'Список товарів' },
                        400: { description: 'Помилка валідації' }
                    }
                },
                post: {
                    summary: 'Створити товар',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    example: {
                                        category_id: 1,
                                        name: 'SSD Samsung 1TB',
                                        description: 'NVMe SSD накопичувач',
                                        price: 3499.99,
                                        stock_count: 15,
                                        rating: 4.8
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Товар створено' },
                        400: { description: 'Помилка валідації' }
                    }
                }
            },
            '/auth/register': {
                post: {
                    summary: 'Реєстрація користувача',
                    responses: { 201: { description: 'Користувача створено' } }
                }
            },
            '/auth/login': {
                post: {
                    summary: 'Авторизація користувача та отримання JWT',
                    responses: { 200: { description: 'Авторизація успішна' } }
                }
            },
            '/status': {
                get: {
                    summary: 'Перевірка стану сервера',
                    responses: { 200: { description: 'Сервер працює' } }
                }
            }
        }
    },
    apis: []
};

module.exports = swaggerJsdoc(options);
