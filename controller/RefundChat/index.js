
const { Op, literal } = require('sequelize');
const { responseObject } = require("../../utils/responseObject")

const chatModel = require('../../models/refundChatsModel');
const messageModel = require("../../models/refundMessagesModel");
const usersChatsModel = require('../../models/refundUsersChatsModel');
const userModel = require('../../models/userModel');
const refundMessageStatusModel = require('../../models/refundMessageStatusModel');
const { uploadMultipleToCloudinary } = require('../../utils/cloudinary/cloudinary');


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
            'chatId', 'content', 'contentType', 'createdAt'
        ],
        include: [
            {
                model: userModel,
                attributes: ['email']
            },
            {
                model: refundMessageStatusModel
            }
        ],
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
                    msg.dataValues.users = chat.dataValues.users.map(u => u.dataValues); // other participants
                    msg.dataValues.refundMessageStatus = msg.dataValues.refundMessageStatus.map(s => s.dataValues);
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
        const userEmail = req.userEmail;
        const refundTicket = req.params.refundTicket

        let chatId = await chatModel.findOne({
            attributes: ['chatId'],
            where: {
                refundTicket: refundTicket
            }
        });

        if(!chatId) {
            return res.status(404).send(responseObject("No Chat Found", 404, []))
        }

        chatId = chatId.dataValues.chatId;

        let messages = await messageModel.findAll({
            attributes: ['messageId', 'content', 'contentType', 'createdAt'],
            where: {
                chatId: chatId
            },
            include: [
                {
                    model: userModel,
                    attributes: ['email', 'firstName', "lastName", "profilePic"]
                },
                {
                    model: refundMessageStatusModel,
                    attributes: ['isRead'],
                    include: {
                        model: userModel,
                        attributes: ['email', 'firstName', "lastName", "profilePic"]
                    }
                }
            ]
        })
        //
        messages = messages.map(msg => {
            msg.dataValues.sender = msg.dataValues.user.dataValues;
            delete msg.dataValues.user;
            msg.dataValues.recipients = msg.dataValues.refundMessageStatuses.map(r => {
                r.dataValues.user = r.dataValues.user.dataValues;
                return r.dataValues;
            });
            delete msg.dataValues.refundMessageStatuses;
            return msg.dataValues;
        });
        //
        let messageIDs = messages.map(m => m.messageId);
        //
        await refundMessageStatusModel.update({ isRead: true }, {
            where: {
                messageId: {
                    [Op.in]: messageIDs
                },
                recipient: userEmail,
                isRead: false
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


const uploadImages = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .send(
            responseObject(
              "Missing required parameter - images",
              400,
              "",
              "Missing required parameter - images"
            )
          );
      }
    //
    const imagesUploadResponse = await uploadMultipleToCloudinary(
        req.files,
        "chat"
      );
      if (!imagesUploadResponse.isSuccess) {
        return res.status(500).send(responseObject("Image/s Uplaod Error", 500, "", imagesUploadResponse.error));
      }
    //
    return res.send(responseObject("Image/s Uploaded Successfully", 200, imagesUploadResponse.data)); // ['', '']
}


module.exports = { getAllChats, getAllMessagesOfAChat, uploadImages }
