const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')
const subscription = require('./subscriptionModel');

const plan = sequelize.define("plan", {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    title: {
        type: DataTypes.ENUM('Monthly', 'Yearly'),
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    coursesLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    productsLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    servicesLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    subscriptionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: subscription,
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
})


module.exports = plan