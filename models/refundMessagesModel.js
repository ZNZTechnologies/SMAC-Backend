const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');
const chatModel = require('./chatModel');

const refundMessagesModel = sequelize.define('refundMessages', {
    messageId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    senderEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: "users",
            key: "email"
        },
        onDelete: "CASCADE"
    },
    chatId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "refundChats",
            key: "chatId"
        },
        onDelete: "CASCADE"
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    contentType: {
        type: DataTypes.ENUM('text', 'image_url', 'page_url'),
        defaultValue: 'text'
    }
})



module.exports = refundMessagesModel
