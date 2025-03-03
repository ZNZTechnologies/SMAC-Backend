const sequelize = require("../database/connection")
const { DataTypes } = require("sequelize")

const chatModel = sequelize.define("chats", {
    chatId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    }
})

module.exports = chatModel
