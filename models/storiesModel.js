const { DataTypes } = require('sequelize')
const sequelize = require('.././database/connection');

const storiesModel = sequelize.define('stories', {
    storyId: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: "email"
        },
        onDelete: 'CASCADE'
    },
    storyImage: {
        type: DataTypes.STRING,
        allowNull: false
    },
});






module.exports = storiesModel