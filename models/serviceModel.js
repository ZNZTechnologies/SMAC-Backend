const { DataTypes } = require('sequelize')

const sequelize = require('../database/connection');
const userModel = require('./userModel');
const serviceParentCategory = require('./serviceParentCategory');

const serviceModel = sequelize.define("service", {
    serviceId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    parentCategory: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: serviceParentCategory,
            key: "serviceParentCategoryId"
        },
        onDelete: 'CASCADE',
        onUpdate: "CASCADE"
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue("images");
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue("images", value ? JSON.stringify(value) : null);
        },
    },
    title: { // service-name
        type: DataTypes.STRING,
        allowNull: false
    },
    serviceFee: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: userModel,
            key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
})

module.exports = serviceModel
