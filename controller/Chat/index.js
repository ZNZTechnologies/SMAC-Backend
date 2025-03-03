const { Op, literal } = require('sequelize');
const { responseObject } = require("../../utils/responseObject")

const chatModel = require('../../models/chatModel');
const messageModel = require("../../models/messageModel");
const userModel = require('../../models/userModel');
const usersChatsModel = require('../../models/usersChatsModel');


const getAllChats = async (req, res) => {
    try {
        const userEmail = req.userEmail;

        // Find all chat IDs that the user is part of
        const userChats = await usersChatsModel.findAll({
            where: { userEmail },
            attributes: ['chatId']
        });

        // Extract chat IDs
        const chatIds = userChats.map(userChat => userChat.dataValues.chatId);

        // Find all chats with the given chat IDs and include associated users
        const chats = await chatModel.findAll({
            where: { chatId: { [Op.in]: chatIds } },
            include: {
                model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"], through: { attributes: [] }, where: {
                    email: {
                        [Op.ne]: userEmail
                    }
                }
            }
        });

        let latestMessages = await messageModel.findAll({
        attributes: [
            'chatId', 'content', 'isSent', 'createdAt'
        ],
        include: {
            model: userModel,
            attributes: ['email']
        },
        where: {
            chatId: { [Op.in]: chatIds },
            createdAt: {
                [Op.eq]: literal(`
                  (SELECT MAX(createdAt) FROM messages AS m 
                   WHERE m.chatId = messages.chatId)
                `)
              }
        },
        order: [['createdAt', 'DESC']]
        });

        let payLoad = new Array();
        latestMessages.forEach(msg => {
            chats.forEach(chat => {
                if(chat.dataValues.chatId == msg.dataValues.chatId) {
                    msg.dataValues.senderEmail = msg.dataValues.user.dataValues.email;
                    msg.dataValues.user = chat.dataValues.users[0].dataValues;
                    return;
                }
            });
            //
            payLoad.push(msg.dataValues);
        });

        return res.status(200).json(responseObject("Successfully Retrieved", 200, payLoad));
    } catch (error) {
        console.log(error);
        return res.status(500).json(responseObject("Internal Server Error", 500, "", "Server Error"));
    }
};



const getAllMessagesOfAChat = async (req, res) => {
    try {
        const chatId = req.params.chatId


        const messages = await messageModel.findAll({
            where: {
                chatId
            },
            include: [
                {
                    model: userModel,
                    attributes: ['email', 'firstName', "lastName", "profilePic"]
                }
            ]
        })
        //
        await messageModel.update({ isSent: true }, {
            where: {
                chatId: chatId,
                isSent: false
            }
        });
        //
        const temp = messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        return res.status(200).send(responseObject("Messges retreived", 200, temp))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}



module.exports = { getAllChats, getAllMessagesOfAChat }