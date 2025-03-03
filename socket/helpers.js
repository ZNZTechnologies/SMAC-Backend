
const { getConnectedUsers } = require('./shared');
const userModel = require('../models/userModel');
const notificationModel = require('../models/notificationsModel');
const { responseObject } = require('../utils/responseObject');

// senderEmail: String, receiverEmails: Array[Strings], notificationType: String, message: String, referenceId: String (Optional)
const sendNotifications = async (io, senderEmail, receiverEmails, notificationType, message, referenceId = null) => {
    let sender = await userModel.findOne({
        attributes: ['id', 'email', 'firstName', 'lastName', 'profilePic'],
        where: {
            email: senderEmail
        },
        raw: true
    });
    //
    receiverEmails.forEach(async receiverEmail => {
        let notification = await notificationModel.create({
            referenceId: referenceId ? referenceId : null, // can be used to lead user to the target page/component
            type: notificationType,
            message: `${sender.firstName + " " + sender.lastName + " " + message}`,
            senderEmail: sender.email,
            receiverEmail: receiverEmail
        });
        //
        if(notification) {
            let payLoad = {
                id: notification.dataValues.id,
                referenceId: notification.dataValues.referenceId,
                type: notification.dataValues.type,
                message: notification.dataValues.message,
                createdAt: notification.dataValues.createdAt,
                sender: {
                    id: sender.id,
                    email: sender.email,
                    firstName: sender.firstName,
                    lastName: sender.lastName,
                    profilePic: sender.profilePic
                }
            }
            //
            io.to(receiverEmail).emit("newNotification", payLoad);
        }
    });
}

const joinRefundRoomAndEmitMessage = async (io, room, userEmails, chatWithUsers, messageWithSender) => { // room = refundChatId
    if(io.sockets.sockets.size > 0) {
        let liveUsers = getConnectedUsers();
        userEmails.forEach(userEmail => {
            const user = liveUsers.find(user => user.email === userEmail);
            
            if (user) {
                const socket = io.sockets.sockets.get(user.socketId);
                
                if (socket) {
                    socket.join(room);
                    console.log(`${userEmail} joined room: ${room}`);
                } else {
                    console.log(`cannot get socket-instance for ${userEmail}`);
                }
            } else {
                console.log(`${userEmail} is not connected`);
            }
        });
        //
        io.to(room).emit("newRefundChat", responseObject("chat created", 201, {
            ...chatWithUsers.toJSON()
        }));
        //
        io.to(room).emit("newRefundMessage", responseObject("message created", 201, messageWithSender));
    } else {
        console.log('no socket clients');
    }
};

module.exports = {
    sendNotifications,
    joinRefundRoomAndEmitMessage
};
