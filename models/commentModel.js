const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');
const postModel = require('./postModel');
const userModel = require('./userModel');

const commentModel = sequelize.define('comments', {
    commentId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    commentText: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    postId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: postModel,
            key: "postId"
        },
        onDelete: 'CASCADE'
    },
    userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: userModel,
            key: "email"
        },
        onDelete: "CASCADE"
    },

})


module.exports = commentModel
