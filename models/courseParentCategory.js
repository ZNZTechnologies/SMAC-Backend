const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')


const courseParentCategory = sequelize.define("courseParentCategories", {
    courseParentCategoryId: {
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



module.exports = courseParentCategory