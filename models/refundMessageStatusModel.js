const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');
const chatModel = require('./chatModel');

const refundMessageStatusModel = sequelize.define('refundMessageStatus', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    recipient: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: "users",
            key: "email"
        },
        onDelete: "CASCADE"
    },
    messageId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "refundMessages",
            key: "messageId"
        },
        onDelete: "CASCADE"
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
})



module.exports = refundMessageStatusModel
