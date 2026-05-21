const request = require('supertest');
const app = require('../app');

describe('Lab 5 API tests', () => {
    test('GET / повертає статус 200', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Backend працює');
    });

    test('GET /status повертає інформацію про сервер', async () => {
        const response = await request(app).get('/status');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('OK');
        expect(response.body).toHaveProperty('memoryUsage');
    });

    test('POST /products без JWT повертає 401', async () => {
        const response = await request(app)
            .post('/products')
            .send({
                category_id: 1,
                name: 'SSD Samsung 1TB',
                description: 'NVMe SSD',
                price: 3499.99,
                stock_count: 15,
                rating: 4.8
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Немає токена');
    });

    test('Helmet додає безпечні HTTP-заголовки', async () => {
        const response = await request(app).get('/');
        expect(response.headers).toHaveProperty('x-content-type-options');
    });
});
