const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');
const postModel = require('./postModel');
const interestModel = require('./interestModel');


// const postInterestBridge = sequelize.define("postInterestBridge", {
//     postInterestBridgeId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         primaryKey: true,
//         defaultValue: DataTypes.UUIDV4
//     },
//     // postId: {
//     //     type: DataTypes.UUID,
//     //     allowNull: false,
//     //     references: {
//     //         model: postModel,
//     //         key: "postId"
//     //     },
//     //     onDelete: "CASCADE"
//     // },
//     // interestId: {
//     //     type: DataTypes.UUID,
//     //     allowNull: false,
//     //     references: {
//     //         model: interestModel,
//     //         key: "Id"
//     //     },
//     //     onDelete: "CASCADE"
//     // }
// })

const postInterestBridge = sequelize.define("postInterestBridge", {
    postInterestBridgeId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    postId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: postModel,
            key: "postId"
        },
        onDelete: "CASCADE"
    },
    interestId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: interestModel,
            key: "id"  // Ensure this matches the actual column in the interest model
        },
        onDelete: "CASCADE"
    }
});


module.exports = postInterestBridge