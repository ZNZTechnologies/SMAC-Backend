const sequelize = require("../database/connection")
const { DataTypes } = require("sequelize")

const usersChatsModel = sequelize.define("userschats", {
    userEmail: {
        type: DataTypes.STRING,
        references: {
            model: "users", // 'Movies' would also work
            key: 'email',
        },
        onDelete: "CASCADE",
        allowNull: false
    },
    chatId: {
        type: DataTypes.UUID,
        references: {
            model: "chats", // 'Actors' would also work
            key: 'chatId',
        },
        onDelete: "CASCADE",
        allowNull: false
    },

})


module.exports = usersChatsModel
