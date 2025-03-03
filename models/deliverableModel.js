const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')
const service = require('./serviceModel');

const deliverable = sequelize.define("deliverable", {
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
    serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: service,
            key: 'serviceId'
        },
        onDelete: 'CASCADE'
    }
})

module.exports = deliverable