const { DataTypes } = require('sequelize')
const sequelize = require('.././database/connection');

const storyViewModel = sequelize.define('storyView', {
    storyId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
});



module.exports = storyViewModel