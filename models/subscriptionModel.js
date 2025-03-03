const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const subscription = sequelize.define("subscription", {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
    }
})


module.exports = subscription