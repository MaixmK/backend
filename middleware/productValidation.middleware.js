const { body, param, query } = require('express-validator');

const validateProductId = [
    param('id').isInt({ min: 1 }).withMessage('ID товару має бути додатним цілим числом')
];

const validateProductQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('page має бути додатним числом'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit має бути від 1 до 100'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice має бути числом від 0'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice має бути числом від 0'),
    query('category_id').optional().isInt({ min: 1 }).withMessage('category_id має бути додатним числом'),
    query('sortBy').optional().isIn(['id', 'name', 'price', 'rating', 'stock_count']).withMessage('Недопустиме поле сортування'),
    query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('sortOrder має бути ASC або DESC')
];

const validateProductBody = [
    body('category_id').isInt({ min: 1 }).withMessage('category_id обов’язковий і має бути додатним числом'),
    body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Назва товару має містити від 3 до 100 символів'),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }).withMessage('Опис не може перевищувати 1000 символів'),
    body('price').isFloat({ min: 0.01 }).withMessage('Ціна має бути числом більше 0'),
    body('stock_count').isInt({ min: 0 }).withMessage('Кількість має бути цілим числом від 0'),
    body('rating').optional({ nullable: true }).isFloat({ min: 0, max: 5 }).withMessage('Рейтинг має бути від 0 до 5')
];

module.exports = {
    validateProductId,
    validateProductQuery,
    validateProductBody
};
