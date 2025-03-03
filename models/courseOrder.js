const { DataTypes } = require('sequelize')

const sequelize = require('../database/connection');

const courseOrder = sequelize.define("courseOrder", {
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
    courseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'courses',
            key: "courseId"
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





module.exports = courseOrder
