module.exports = (...allowedRoles) => {
    const roles = allowedRoles
        .flat()
        .filter(Boolean)
        .map((role) => String(role).toLowerCase());

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Користувач не авторизований'
            });
        }

        const userRole = String(req.user.role || '').toLowerCase();

        if (!userRole) {
            return res.status(403).json({
                message: 'Для користувача не визначено роль'
            });
        }

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                message: 'Доступ заборонено. Недостатньо прав',
                requiredRoles: roles,
                userRole
            });
        }

        next();
    };
};
