const sequelize = require("../database/connection")
const { DataTypes } = require("sequelize")

const refundUsersChatsModel = sequelize.define("refundUsersChats", {
    userEmail: {
        type: DataTypes.STRING,
        references: {
            model: "users",
            key: 'email',
        },
        onDelete: "CASCADE",
        allowNull: false
    },
    chatId: {
        type: DataTypes.UUID,
        references: {
            model: "refundChats",
            key: 'chatId',
        },
        onDelete: "CASCADE",
        allowNull: false
    },

})


module.exports = refundUsersChatsModel
