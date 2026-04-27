const attempts = {};

const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 5 * 60 * 1000; // 5 хвилин

module.exports = (req, res, next) => {
    const email = req.body.email;

    if (!email) {
        return next();
    }

    const userAttempts = attempts[email];

    if (userAttempts && userAttempts.blockedUntil > Date.now()) {
        return res.status(429).json({
            message: 'Забагато невдалих спроб. Спробуйте пізніше.'
        });
    }

    req.loginAttempts = attempts;
    next();
};