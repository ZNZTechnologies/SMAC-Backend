const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection')
const serviceModel = require('./serviceModel')
const serviceSubCategory = require('./serviceSubCategory')

const serviceSubCategoryBridge = sequelize.define("serviceSubCategoryBridge", {
    serviceSubCategoryBridgeId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: serviceModel,
            key: "serviceId"
        },
        onDelete: "CASCADE"
    },
    subCategoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: serviceSubCategory,
            key: "serviceSubCategoryId"
        },
        onDelete: "CASCADE"

    }
})

module.exports = serviceSubCategoryBridge