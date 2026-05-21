const swaggerJsdoc = require('swagger-jsdoc');

const localPort = process.env.PORT || 3000;
const productionUrl = process.env.API_BASE_URL;

const servers = [
    {
        url: `http://localhost:${localPort}`,
        description: 'Local development server'
    }
];

if (productionUrl) {
    servers.unshift({
        url: productionUrl,
        description: 'Production server'
    });
}

const productExample = {
    id: 1,
    category_id: 1,
    name: 'SSD Samsung 1TB',
    description: 'NVMe SSD накопичувач',
    price: '3499.99',
    stock_count: 15,
    rating: '4.80'
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PC Components Store API',
            version: '1.0.0',
            description: 'Swagger/OpenAPI документація REST API інтернет-магазину комп’ютерних комплектуючих для лабораторної роботи №6.'
        },
        servers,
        tags: [
            { name: 'System', description: 'Перевірка працездатності сервера' },
            { name: 'Auth', description: 'Реєстрація, підтвердження email, авторизація та JWT' },
            { name: 'Categories', description: 'CRUD-операції з категоріями товарів' },
            { name: 'Products', description: 'CRUD-операції з товарами, пагінація, фільтрація, сортування та кешування' },
            { name: 'Orders', description: 'CRUD-операції із замовленнями' },
            { name: 'Order items', description: 'CRUD-операції з позиціями замовлення' },
            { name: 'Uploads', description: 'Завантаження одного або кількох файлів' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT access token у форматі: Bearer <token>'
                }
            },
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Помилка сервера' },
                        error: { type: 'string', example: 'Помилка отримання даних' },
                        details: { type: 'string', example: 'Validation error' }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string', example: 'field' },
                                    msg: { type: 'string', example: 'Назва товару обов’язкова' },
                                    path: { type: 'string', example: 'name' },
                                    location: { type: 'string', example: 'body' }
                                }
                            }
                        }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['name', 'email', 'password', 'confirmPassword'],
                    properties: {
                        name: { type: 'string', example: 'Admin User' },
                        email: { type: 'string', format: 'email', example: 'admin@gmail.com' },
                        password: { type: 'string', minLength: 6, example: '123456' },
                        confirmPassword: { type: 'string', minLength: 6, example: '123456' },
                        role: { type: 'string', enum: ['user', 'admin'], example: 'admin' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@gmail.com' },
                        password: { type: 'string', example: '123456' }
                    }
                },
                ConfirmEmailRequest: {
                    type: 'object',
                    required: ['token'],
                    properties: {
                        token: { type: 'string', example: 'paste-email-confirm-token-here' }
                    }
                },
                RefreshTokenRequest: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: { type: 'string', example: 'paste-refresh-token-here' }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Накопичувачі' }
                    }
                },
                CategoryRequest: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Відеокарти' }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        category_id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'SSD Samsung 1TB' },
                        description: { type: 'string', example: 'NVMe SSD накопичувач' },
                        price: { type: 'number', format: 'float', example: 3499.99 },
                        stock_count: { type: 'integer', example: 15 },
                        rating: { type: 'number', format: 'float', example: 4.8 },
                        Category: { $ref: '#/components/schemas/Category' }
                    }
                },
                ProductRequest: {
                    type: 'object',
                    required: ['category_id', 'name', 'price', 'stock_count'],
                    properties: {
                        category_id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'SSD Samsung 1TB' },
                        description: { type: 'string', example: 'NVMe SSD накопичувач' },
                        price: { type: 'number', format: 'float', example: 3499.99 },
                        stock_count: { type: 'integer', example: 15 },
                        rating: { type: 'number', format: 'float', example: 4.8 }
                    }
                },
                ProductsListResponse: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', enum: ['database', 'cache'], example: 'database' },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 1 },
                        totalPages: { type: 'integer', example: 1 },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Product' }
                        }
                    },
                    example: {
                        source: 'database',
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                        data: [productExample]
                    }
                },
                ProductByIdResponse: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', enum: ['database', 'cache'], example: 'database' },
                        data: { $ref: '#/components/schemas/Product' }
                    },
                    example: {
                        source: 'database',
                        data: productExample
                    }
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 1 },
                        total_price: { type: 'number', format: 'float', example: 3499.99 },
                        status: { type: 'string', enum: ['new', 'paid', 'cancelled'], example: 'new' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                OrderRequest: {
                    type: 'object',
                    required: ['user_id', 'total_price'],
                    properties: {
                        user_id: { type: 'integer', example: 1 },
                        total_price: { type: 'number', format: 'float', example: 3499.99 },
                        status: { type: 'string', enum: ['new', 'paid', 'cancelled'], example: 'new' }
                    }
                },
                OrderItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        order_id: { type: 'integer', example: 1 },
                        product_id: { type: 'integer', example: 1 },
                        quantity: { type: 'integer', example: 2 },
                        unit_price: { type: 'number', format: 'float', example: 3499.99 }
                    }
                },
                OrderItemRequest: {
                    type: 'object',
                    required: ['order_id', 'product_id', 'quantity', 'unit_price'],
                    properties: {
                        order_id: { type: 'integer', example: 1 },
                        product_id: { type: 'integer', example: 1 },
                        quantity: { type: 'integer', example: 2 },
                        unit_price: { type: 'number', format: 'float', example: 3499.99 }
                    }
                },
                UploadResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Файл успішно завантажено' },
                        file: {
                            type: 'object',
                            properties: {
                                originalName: { type: 'string', example: 'pc.png' },
                                filename: { type: 'string', example: '1710000000000-pc.png' },
                                mimetype: { type: 'string', example: 'image/png' },
                                size: { type: 'integer', example: 204800 },
                                path: { type: 'string', example: 'uploads/1710000000000-pc.png' }
                            }
                        }
                    }
                }
            },
            parameters: {
                IdParam: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'integer', minimum: 1 },
                    example: 1
                }
            }
        },
        paths: {
            '/': {
                get: {
                    tags: ['System'],
                    summary: 'Перевірити головний маршрут API',
                    responses: {
                        200: {
                            description: 'Backend працює',
                            content: {
                                'application/json': {
                                    example: { message: 'Backend працює' }
                                }
                            }
                        }
                    }
                }
            },
            '/status': {
                get: {
                    tags: ['System'],
                    summary: 'Перевірити стан сервера',
                    responses: {
                        200: {
                            description: 'Інформація про стан сервера',
                            content: {
                                'application/json': {
                                    example: {
                                        status: 'OK',
                                        uptime: 120.25,
                                        memoryUsage: {},
                                        cpuUsage: {}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Зареєструвати нового користувача',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RegisterRequest' }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Користувача створено, повертається token для підтвердження email',
                            content: {
                                'application/json': {
                                    example: {
                                        message: 'Користувача створено. Підтвердьте email.',
                                        emailConfirmToken: 'generated-token'
                                    }
                                }
                            }
                        },
                        400: { description: 'Помилка валідації або користувач вже існує', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                        500: { description: 'Помилка сервера' }
                    }
                }
            },
            '/auth/confirm-email': {
                post: {
                    tags: ['Auth'],
                    summary: 'Підтвердити email користувача',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ConfirmEmailRequest' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Email підтверджено', content: { 'application/json': { example: { message: 'Email успішно підтверджено' } } } },
                        400: { description: 'Невірний або відсутній токен' },
                        500: { description: 'Помилка сервера' }
                    }
                }
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Авторизувати користувача та отримати JWT',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Авторизація успішна',
                            content: {
                                'application/json': {
                                    example: {
                                        message: 'Авторизація успішна',
                                        accessToken: 'jwt-access-token',
                                        refreshToken: 'jwt-refresh-token'
                                    }
                                }
                            }
                        },
                        400: { description: 'Невірні дані входу' },
                        403: { description: 'Email не підтверджено' },
                        429: { description: 'Перевищено ліміт спроб входу' },
                        500: { description: 'Помилка сервера' }
                    }
                }
            },
            '/auth/refresh-token': {
                post: {
                    tags: ['Auth'],
                    summary: 'Оновити access token через refresh token',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RefreshTokenRequest' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Новий access token', content: { 'application/json': { example: { accessToken: 'new-jwt-access-token' } } } },
                        401: { description: 'Refresh token не передано' },
                        403: { description: 'Refresh token недійсний' }
                    }
                }
            },
            '/categories': {
                get: {
                    tags: ['Categories'],
                    summary: 'Отримати всі категорії',
                    responses: {
                        200: { description: 'Список категорій', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } } },
                        500: { description: 'Помилка отримання категорій' }
                    }
                },
                post: {
                    tags: ['Categories'],
                    summary: 'Створити категорію',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryRequest' } } } },
                    responses: {
                        201: { description: 'Категорію створено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
                        500: { description: 'Помилка створення категорії' }
                    }
                }
            },
            '/categories/{id}': {
                put: {
                    tags: ['Categories'],
                    summary: 'Оновити категорію за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryRequest' } } } },
                    responses: {
                        200: { description: 'Категорію оновлено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
                        404: { description: 'Категорію не знайдено' },
                        500: { description: 'Помилка оновлення категорії' }
                    }
                },
                delete: {
                    tags: ['Categories'],
                    summary: 'Видалити категорію за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    responses: {
                        200: { description: 'Категорію видалено', content: { 'application/json': { example: { message: 'Категорію видалено' } } } },
                        404: { description: 'Категорію не знайдено' },
                        500: { description: 'Помилка видалення категорії' }
                    }
                }
            },
            '/products': {
                get: {
                    tags: ['Products'],
                    summary: 'Отримати товари з пагінацією, фільтрацією, сортуванням і кешуванням',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, example: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, example: 10 } },
                        { name: 'category_id', in: 'query', schema: { type: 'integer', example: 1 } },
                        { name: 'search', in: 'query', schema: { type: 'string', example: 'SSD' } },
                        { name: 'minPrice', in: 'query', schema: { type: 'number', example: 1000 } },
                        { name: 'maxPrice', in: 'query', schema: { type: 'number', example: 50000 } },
                        { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['id', 'name', 'price', 'rating', 'stock_count'], example: 'price' } },
                        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'], example: 'ASC' } }
                    ],
                    responses: {
                        200: { description: 'Список товарів', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductsListResponse' } } } },
                        400: { description: 'Помилка валідації параметрів', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                        500: { description: 'Помилка отримання товарів' }
                    }
                },
                post: {
                    tags: ['Products'],
                    summary: 'Створити товар',
                    description: 'Маршрут доступний тільки користувачу з роллю admin. У Swagger UI натисніть Authorize і вставте accessToken.',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductRequest' } } } },
                    responses: {
                        201: { description: 'Товар створено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
                        400: { description: 'Помилка валідації', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
                        401: { description: 'Не передано JWT token' },
                        403: { description: 'Недостатньо прав доступу' },
                        500: { description: 'Помилка створення товару' }
                    }
                }
            },
            '/products/{id}': {
                get: {
                    tags: ['Products'],
                    summary: 'Отримати товар за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    responses: {
                        200: { description: 'Дані товару', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductByIdResponse' } } } },
                        400: { description: 'Помилка валідації id' },
                        404: { description: 'Товар не знайдено' },
                        500: { description: 'Помилка отримання товару' }
                    }
                },
                put: {
                    tags: ['Products'],
                    summary: 'Оновити товар за id',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductRequest' } } } },
                    responses: {
                        200: { description: 'Товар оновлено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
                        400: { description: 'Помилка валідації' },
                        401: { description: 'Не передано JWT token' },
                        403: { description: 'Недостатньо прав доступу' },
                        404: { description: 'Товар не знайдено' },
                        500: { description: 'Помилка оновлення товару' }
                    }
                },
                delete: {
                    tags: ['Products'],
                    summary: 'Видалити товар за id',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    responses: {
                        200: { description: 'Товар видалено', content: { 'application/json': { example: { message: 'Товар видалено' } } } },
                        400: { description: 'Помилка валідації id' },
                        401: { description: 'Не передано JWT token' },
                        403: { description: 'Недостатньо прав доступу' },
                        404: { description: 'Товар не знайдено' },
                        500: { description: 'Помилка видалення товару' }
                    }
                }
            },
            '/orders': {
                get: {
                    tags: ['Orders'],
                    summary: 'Отримати всі замовлення',
                    responses: {
                        200: { description: 'Список замовлень', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } },
                        500: { description: 'Помилка отримання замовлень' }
                    }
                },
                post: {
                    tags: ['Orders'],
                    summary: 'Створити замовлення',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderRequest' } } } },
                    responses: {
                        201: { description: 'Замовлення створено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
                        500: { description: 'Помилка створення замовлення' }
                    }
                }
            },
            '/orders/{id}': {
                get: {
                    tags: ['Orders'],
                    summary: 'Отримати замовлення за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    responses: {
                        200: { description: 'Дані замовлення', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
                        404: { description: 'Замовлення не знайдено' },
                        500: { description: 'Помилка отримання замовлення' }
                    }
                },
                put: {
                    tags: ['Orders'],
                    summary: 'Оновити замовлення за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderRequest' } } } },
                    responses: {
                        200: { description: 'Замовлення оновлено', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
                        404: { description: 'Замовлення не знайдено' },
                        500: { description: 'Помилка оновлення замовлення' }
                    }
                },
                delete: {
                    tags: ['Orders'],
                    summary: 'Видалити замовлення за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    responses: {
                        200: { description: 'Замовлення видалено', content: { 'application/json': { example: { message: 'Замовлення видалено' } } } },
                        404: { description: 'Замовлення не знайдено' },
                        500: { description: 'Помилка видалення замовлення' }
                    }
                }
            },
            '/order-items': {
                get: {
                    tags: ['Order items'],
                    summary: 'Отримати всі позиції замовлень',
                    responses: {
                        200: { description: 'Список позицій', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } } } } },
                        500: { description: 'Помилка отримання позицій замовлення' }
                    }
                },
                post: {
                    tags: ['Order items'],
                    summary: 'Створити позицію замовлення',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderItemRequest' } } } },
                    responses: {
                        201: { description: 'Позицію створено', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderItem' } } } },
                        500: { description: 'Помилка створення позиції замовлення' }
                    }
                }
            },
            '/order-items/{id}': {
                get: {
                    tags: ['Order items'],
                    summary: 'Отримати позицію замовлення за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    responses: {
                        200: { description: 'Дані позиції', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderItem' } } } },
                        404: { description: 'Позицію замовлення не знайдено' },
                        500: { description: 'Помилка отримання позиції замовлення' }
                    }
                },
                put: {
                    tags: ['Order items'],
                    summary: 'Оновити позицію замовлення за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderItemRequest' } } } },
                    responses: {
                        200: { description: 'Позицію оновлено', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderItem' } } } },
                        404: { description: 'Позицію замовлення не знайдено' },
                        500: { description: 'Помилка оновлення позиції замовлення' }
                    }
                },
                delete: {
                    tags: ['Order items'],
                    summary: 'Видалити позицію замовлення за id',
                    parameters: [{ $ref: '#/components/parameters/IdParam' }],
                    responses: {
                        200: { description: 'Позицію видалено', content: { 'application/json': { example: { message: 'Позицію замовлення видалено' } } } },
                        404: { description: 'Позицію замовлення не знайдено' },
                        500: { description: 'Помилка видалення позиції замовлення' }
                    }
                }
            },
            '/upload': {
                post: {
                    tags: ['Uploads'],
                    summary: 'Завантажити один файл',
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['file'],
                                    properties: {
                                        file: {
                                            type: 'string',
                                            format: 'binary',
                                            description: 'JPG, PNG або PDF до 5 MB'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Файл завантажено', content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadResponse' } } } },
                        400: { description: 'Файл не було завантажено' },
                        413: { description: 'Файл перевищує 5 MB' },
                        500: { description: 'Помилка сервера' }
                    }
                }
            },
            '/upload-multiple': {
                post: {
                    tags: ['Uploads'],
                    summary: 'Завантажити кілька файлів',
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['files'],
                                    properties: {
                                        files: {
                                            type: 'array',
                                            maxItems: 5,
                                            items: {
                                                type: 'string',
                                                format: 'binary'
                                            },
                                            description: 'До 5 файлів JPG, PNG або PDF, кожен до 5 MB'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Файли завантажено' },
                        400: { description: 'Файли не було завантажено' },
                        413: { description: 'Один із файлів перевищує 5 MB' },
                        500: { description: 'Помилка сервера' }
                    }
                }
            }
        }
    },
    apis: []
};

module.exports = swaggerJsdoc(options);
