const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const loginLimiter = require('../middleware/loginLimiter.middleware');

const {
    generateAccessToken,
    generateRefreshToken,
    REFRESH_SECRET,
    ACCESS_SECRET
} = require('../utils/token');

const { logError } = require('../utils/logger');
const { generateRandomToken } = require('../utils/randomToken');

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let refreshTokens = [];

/* =========================
   ДОПОМІЖНІ ФУНКЦІЇ
========================= */

function increaseAttempts(attemptsStore, email) {
    const MAX_ATTEMPTS = 5;
    const BLOCK_TIME_MS = 5 * 60 * 1000; // 5 хвилин

    if (!attemptsStore[email]) {
        attemptsStore[email] = {
            count: 0,
            blockedUntil: null
        };
    }

    attemptsStore[email].count += 1;

    if (attemptsStore[email].count >= MAX_ATTEMPTS) {
        attemptsStore[email].blockedUntil = Date.now() + BLOCK_TIME_MS;
        attemptsStore[email].count = 0;
    }
}

/* =========================
   РЕЄСТРАЦІЯ
========================= */

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                message: 'Всі поля обов’язкові'
            });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Невірний формат email'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Пароль мінімум 6 символів'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Паролі не співпадають'
            });
        }

        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({
                message: 'Користувач вже існує'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const emailConfirmToken = generateRandomToken();

        await User.create({
            name,
            email,
            password_hash: hashedPassword,
            role: role === 'admin' ? 'admin' : 'user',
            is_email_confirmed: false,
            email_confirm_token: emailConfirmToken
        });

        return res.status(201).json({
            message: 'Користувача створено. Підтвердьте email.',
            emailConfirmToken
        });

    } catch (error) {
        logError('Помилка при реєстрації', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   ПІДТВЕРДЖЕННЯ EMAIL
========================= */

router.post('/confirm-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: 'Токен обов’язковий'
            });
        }

        const user = await User.findOne({
            where: { email_confirm_token: token }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Невірний токен підтвердження'
            });
        }

        user.is_email_confirmed = true;
        user.email_confirm_token = null;
        await user.save();

        return res.status(200).json({
            message: 'Email успішно підтверджено'
        });

    } catch (error) {
        logError('Помилка при підтвердженні email', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   ЛОГІН
========================= */

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Всі поля обов’язкові'
            });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Невірний формат email'
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            increaseAttempts(req.loginAttempts, email);
            return res.status(400).json({
                message: 'Користувача не знайдено'
            });
        }

        if (!user.is_email_confirmed) {
            return res.status(403).json({
                message: 'Email не підтверджено'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            increaseAttempts(req.loginAttempts, email);
            return res.status(400).json({
                message: 'Невірний пароль'
            });
        }

        delete req.loginAttempts[email];

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        refreshTokens.push(refreshToken);

        return res.status(200).json({
            message: 'Авторизація успішна',
            accessToken,
            refreshToken
        });

    } catch (error) {
        logError('Помилка при авторизації', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   REFRESH TOKEN
========================= */

router.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            message: 'Немає refresh token'
        });
    }

    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json({
            message: 'Невірний refresh token'
        });
    }

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const accessToken = jwt.sign(
            {
                id: decoded.id,
                email: decoded.email
            },
            ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        return res.status(200).json({ accessToken });

    } catch (error) {
        logError('Помилка refresh token', error);
        return res.status(403).json({
            message: 'Refresh token недійсний або прострочений'
        });
    }
});

/* =========================
   ЗАХИЩЕНИЙ ПРОФІЛЬ
========================= */

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: [
                'id',
                'name',
                'email',
                'role',
                'is_email_confirmed',
                'created_at'
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'Користувача не знайдено'
            });
        }

        return res.status(200).json({
            message: 'Доступ дозволено',
            user
        });

    } catch (error) {
        logError('Помилка при отриманні профілю', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   LOGOUT
========================= */

router.post('/logout', authMiddleware, (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        refreshTokens = refreshTokens.filter(token => token !== refreshToken);
    }

    return res.status(200).json({
        message: 'Вихід виконано успішно'
    });
});

/* =========================
   ОНОВЛЕННЯ ПРОФІЛЮ
========================= */

router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Користувача не знайдено'
            });
        }

        if (email && !emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Невірний формат email'
            });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ where: { email } });

            if (emailExists) {
                return res.status(400).json({
                    message: 'Email вже використовується'
                });
            }

            user.email = email;
            user.is_email_confirmed = false;
            user.email_confirm_token = generateRandomToken();
        }

        if (name) {
            user.name = name;
        }

        await user.save();

        return res.status(200).json({
            message: 'Профіль оновлено',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_email_confirmed: user.is_email_confirmed,
                created_at: user.created_at
            },
            emailConfirmToken: user.email_confirm_token || null
        });

    } catch (error) {
        logError('Помилка при оновленні профілю', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   ЗМІНА ПАРОЛЯ
========================= */

router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: 'Всі поля обов’язкові'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Новий пароль мінімум 6 символів'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'Паролі не співпадають'
            });
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Користувача не знайдено'
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Старий пароль невірний'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password_hash = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: 'Пароль змінено успішно'
        });

    } catch (error) {
        logError('Помилка при зміні пароля', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   ВИДАЛЕННЯ АКАУНТА
========================= */

router.delete('/delete-account', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Користувача не знайдено'
            });
        }

        await user.destroy();

        return res.status(200).json({
            message: 'Акаунт видалено'
        });

    } catch (error) {
        logError('Помилка при видаленні акаунта', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   FORGOT PASSWORD
========================= */

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email обов’язковий' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        const resetToken = generateRandomToken();

        user.reset_password_token = resetToken;
        await user.save();

        return res.status(200).json({
            message: 'Токен для скидання пароля згенеровано',
            resetToken
        });

    } catch (error) {
        logError('Помилка при запиті на відновлення пароля', error);
        return res.status(500).json({ message: 'Помилка сервера' });
    }
});

/* =========================
   RESET PASSWORD
========================= */

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: 'Всі поля обов’язкові'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Пароль мінімум 6 символів'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'Паролі не співпадають'
            });
        }

        const user = await User.findOne({
            where: { reset_password_token: token }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Невірний токен скидання пароля'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password_hash = hashedPassword;
        user.reset_password_token = null;

        await user.save();

        return res.status(200).json({
            message: 'Пароль успішно оновлено'
        });

    } catch (error) {
        logError('Помилка при скиданні пароля', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   GOOGLE LOGIN (СПРОЩЕНА ЗАГОТІВЛЯ)
========================= */

router.post('/google-login', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({
                message: 'Для Google login потрібні email і name'
            });
        }

        let user = await User.findOne({ where: { email } });

        if (!user) {
            const randomPassword = await bcrypt.hash(generateRandomToken(), 10);

            user = await User.create({
                name,
                email,
                password_hash: randomPassword,
                role: 'user',
                is_email_confirmed: true,
                email_confirm_token: null,
                reset_password_token: null
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        refreshTokens.push(refreshToken);

        return res.status(200).json({
            message: 'Google login успішний',
            accessToken,
            refreshToken
        });

    } catch (error) {
        logError('Помилка при Google login', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

/* =========================
   АДМІНСЬКИЙ МАРШРУТ
========================= */

router.get('/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: [
                'id',
                'name',
                'email',
                'role',
                'is_email_confirmed',
                'created_at'
            ]
        });

        return res.status(200).json(users);

    } catch (error) {
        logError('Помилка при отриманні списку користувачів', error);
        return res.status(500).json({
            message: 'Помилка сервера'
        });
    }
});

module.exports = router;