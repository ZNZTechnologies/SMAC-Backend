const sequelize = require("../database/connection")
const { DataTypes } = require("sequelize")

const refundChatsModel = sequelize.define("refundChats", {
    chatId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    refundTicket: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    }
})

module.exports = refundChatsModel
