const sequelize = require("../database/connection")
const { DataTypes } = require("sequelize")

const userSearchesModel = sequelize.define("usersearches", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    userEmail: {
        type: DataTypes.STRING,
        references: {
            model: "users",
            key: 'email',
        },
        onDelete: "CASCADE",
        allowNull: false
    },
    keyWords: {
        type: DataTypes.STRING,
        allowNull: false
    },
    context: {
        type: DataTypes.ENUM('courses', 'products', 'services', 'global'),
        allowNull: false
    }
})


module.exports = userSearchesModel
