const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')
const subscription = require('./subscriptionModel');

const benefit = sequelize.define("benefit", {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
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


module.exports = benefit