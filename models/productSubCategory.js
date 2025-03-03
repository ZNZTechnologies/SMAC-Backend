const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')

// productSubCategory
const productSubCategory = sequelize.define("productSubCategories", {
    productSubCategoryId: {
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
            model: "productParentCategories",
            key: "productParentCategoryId"
        },
        onDelete: "CASCADE"
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
    }
})



module.exports = productSubCategory