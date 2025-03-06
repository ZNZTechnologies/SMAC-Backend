
const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');

const paymentModel = sequelize.define("payments", {
    paymentId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userEmail: { // also using this for pp_BillReference
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: "users",
            key: "email"
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT"
    },
    description: { // pp_Description
        type: DataTypes.STRING,
        allowNull: false,
    },
    txnReference: { // pp_TxnRefNo
        type: DataTypes.STRING,
        allowNull: false,
    },
    response: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
    },
    status: {
        type: DataTypes.ENUM('failed', 'success', 'pending'),
        allowNull: false,
    },
    statusMessage: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('coursePayment', 'servicePayment', 'subscriptionPayment'),
        allowNull: false,
    },
    orderAmount: { // also using this for pp_Amount
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    taxAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null
    },
    amountReceived: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null
    },
    platformFee: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null
    }
})

module.exports = paymentModel
