const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')


const interest = sequelize.define("interest", {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
      },
    banner: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    }
})


module.exports = interest