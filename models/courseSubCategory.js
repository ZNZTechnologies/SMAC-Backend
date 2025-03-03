const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')

// courseSubCategory
const courseSubCategory = sequelize.define("courseSubCategories", {
    courseSubCategoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parentCategoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "courseParentCategories",
            key: "courseParentCategoryId"
        },
        onDelete: "CASCADE"
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
    },
})



module.exports = courseSubCategory