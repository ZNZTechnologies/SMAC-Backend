const { DataTypes } = require('sequelize')
const sequelize = require('../database/connection');

// ticketNumber ServiceProvider ComplaintReg ServiceName Status Actions

const serviceRefundModel = sequelize.define('servicerefunds', {
    refundId: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            key: "orderId",
            model: "serviceOrders"
        },
        onDelete: "CASCADE"
    },
    serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            key: "serviceId",
            model: "services"
        },
        onDelete: "CASCADE"
    },
    requestingUser: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            key: "email",
            model: "users"
        },
        onDelete: "CASCADE"
    },
    refundSupervisor: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            key: "email",
            model: "users"
        },
        onDelete: "CASCADE"
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', "Closed"),
        defaultValue: 'Pending'
    },
    ticketNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    reasonForRefund: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    reasonForRejected:
    {
        type: DataTypes.TEXT,
        allowNull: true,
    }

});



module.exports = serviceRefundModel