const { DataTypes } = require('sequelize')

const sequelize = require('../database/connection');
const userModel = require('./userModel');

const notificationModel = sequelize.define("notifications", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    referenceId: {
        type: DataTypes.STRING(36),
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('message', 'comment', 'like', 'share', 'refund'),
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    senderEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: userModel,
            key: "email"
        },
        onDelete: "CASCADE"
    },
    receiverEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: userModel,
            key: "email"
        },
        onDelete: "CASCADE"
    },
})

module.exports = notificationModel
