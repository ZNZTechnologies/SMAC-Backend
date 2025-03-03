
const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');

const serviceOrder = sequelize.define("serviceOrder", {
    orderId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: "users",
            key: "email"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'services',
            key: "serviceId"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    purchaseDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('purchased', 'completed', 'refunded'),
        defaultValue: "purchased",
    },
    paymentId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    }
})

module.exports = serviceOrder
