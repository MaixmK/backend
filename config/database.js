const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'pc_components_store',
    'root',
    '06051225',
    {
        host: 'localhost',
        dialect: 'mysql'
    }
);

module.exports = sequelize;