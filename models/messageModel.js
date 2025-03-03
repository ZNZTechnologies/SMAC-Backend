const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');
const chatModel = require('./chatModel');

const messageModel = sequelize.define('messages', {
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
            model: chatModel,
            key: 'chatId'
        },
        onDelete: "CASCADE"
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isSent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
})



module.exports = messageModel
