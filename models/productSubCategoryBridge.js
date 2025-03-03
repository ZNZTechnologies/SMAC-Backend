const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')


const productSubCategoryBridge = sequelize.define("productSubCategoryBridge", {
    productSubCategoryBridgeId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "products",
            key: "productId"
        },
        onDelete: "CASCADE"
    },
    subCategoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "productSubCategories",
            key: "productSubCategoryId"
        },
        onDelete: "CASCADE"
    }
})



module.exports = productSubCategoryBridge