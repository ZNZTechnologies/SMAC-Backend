const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')
const serviceParentCategory = require('./serviceParentCategory')

const serviceSubCategory = sequelize.define("serviceSubCategories", {
    serviceSubCategoryId: {
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
            model: serviceParentCategory,
            key: "serviceParentCategoryId"
        },
        onDelete: "CASCADE"
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
    },
})

module.exports = serviceSubCategory