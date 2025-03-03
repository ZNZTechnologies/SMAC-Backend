
const { Sequelize } = require('sequelize');
const userModel = require("../models/userModel");

const closeConnectionGracefully = async (sequelize) => {
    // Gracefully close the connection pool when the process is terminated
    process.on('SIGINT', async () => {
        try {
            await userModel.update({
                isOnline: false,
                lastSeen: Sequelize.literal("CURRENT_TIMESTAMP"),
                socketId: null
            }, {
                where: { isOnline: true }
            });
            await sequelize.close();
            console.log('Connection pool closed gracefully.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing connection pool:', err);
            process.exit(1);
        }
    });
}

module.exports = closeConnectionGracefully;
