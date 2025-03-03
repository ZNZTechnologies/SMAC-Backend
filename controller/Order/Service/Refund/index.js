const { validateUpdateRefund, validateCreateRefund } = require("../../../../joiSchemas/Service/Refund/");
const chatModel = require("../../../../models/refundChatsModel");
const messageModel = require("../../../../models/refundMessagesModel");
const serviceModel = require("../../../../models/serviceModel");
const serviceOrder = require("../../../../models/serviceOrder");
const serviceRefundModel = require("../../../../models/serviceRefundModel");
const userModel = require("../../../../models/userModel");
const usersChatsModel = require("../../../../models/refundUsersChatsModel");
const { sendNotifications, joinRefundRoomAndEmitMessage } = require("../../../../socket/helpers");
const { responseObject } = require("../../../../utils/responseObject");
const refundMessageStatusModel = require("../../../../models/refundMessageStatusModel");
const refundChatsModel = require("../../../../models/refundChatsModel");
const sequelize = require("../../../../database/connection");


function generateRandomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    let code = '';

    // Generate the first three alphabets
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Generate the next nine digits
    for (let i = 0; i < 9; i++) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return code;
}

// Function to check uniqueness and generate a unique code
async function generateUniqueCode() {
    let unique = false;
    let newCode;

    while (!unique) {
        newCode = generateRandomCode();
        const existingCode = await serviceRefundModel.findOne({ where: { ticketNumber: newCode } });
        if (!existingCode) {
            unique = true;
        }
    }

    return newCode;
}


const includeAttribute = {
    include: [
        { model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] },
        { model: serviceModel, include: [{ model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] }] },
        { model: serviceOrder, as: "order" }
    ],
    attributes: {
        exclude: ["orderId", "serviceId"]
    }
}

const createRefund = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // const { } =
        const userEmail = req.userEmail;
        const orderId = req.params.orderId;

        const { error, value } = validateCreateRefund(req.body)
        if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))


        const order = await serviceOrder.findOne({
            where: {
                orderId,
                userEmail
            }
        });

        if (!order) return res.status(400).send(responseObject("Order not found", 400, "", "Order Id is not valid"));

        const chkPrevRefund = await serviceRefundModel.findOne({
            where: {
                orderId: order.orderId,
                serviceId: order.serviceId,
                requestingUser: userEmail
            }
        });
        if (chkPrevRefund) return res.status(400).send(responseObject("Refund Request Already Created", 400, "", "Can't Create Another Request"))

        if (order.dataValues.status == 'completed') {
            return res.status(400).send(responseObject("Refund request failed", 400, "", "You cannot request refund now because Order is completed"))
        }

        const serviceId = order.serviceId;
        const service = await serviceModel.findByPk(serviceId);
        if (!service) return res.status(400).send(responseObject("Service Not Found", 400, "", "Id is not valid"));

        const ticketNumber = await generateUniqueCode();

        let adminEmail = await userModel.findOne({
            attributes: ['email'],
            where: {
                role: 'admin'
            }
        });
        adminEmail = adminEmail.dataValues.email;

        const refund = await serviceRefundModel.create({
            orderId: order.orderId,
            serviceId: service.serviceId,
            ticketNumber,
            requestingUser: userEmail,
            refundSupervisor: adminEmail,
            reasonForRefund: value.reasonForRefund
        }, { transaction: t });

        const data = await serviceRefundModel.findByPk(refund.refundId, {
            ...includeAttribute
        });

        //////////////////////////////////////////////////////////////////////////////////////
        let authorEmail = await serviceModel.findByPk(serviceId, {
            attributes: ['authorId'],
            include: {
                model: userModel,
                attributes: ['email'],
            }
        });
        authorEmail = authorEmail.dataValues.user.dataValues.email;
        //
        const chat = await chatModel.create({refundTicket: ticketNumber}, { transaction: t });
        //
        let receiverEmails;
        let chatUsers = [adminEmail];
        if (adminEmail == authorEmail) { // if Admin is Seller
            receiverEmails = [adminEmail];
            await usersChatsModel.bulkCreate([
                { userEmail: adminEmail, chatId: chat.chatId },
                { userEmail: userEmail, chatId: chat.chatId }
            ], { transaction: t });
            chatUsers.push(userEmail);
        } else if (adminEmail == userEmail) { // if Admin is Buyer
            receiverEmails = [authorEmail];
            await usersChatsModel.bulkCreate([
                { userEmail: adminEmail, chatId: chat.chatId },
                { userEmail: authorEmail, chatId: chat.chatId }
            ], { transaction: t });
            chatUsers.push(authorEmail);
        } else { // if Admin is neither Seller nor Buyer
            receiverEmails = [adminEmail, authorEmail];
            await usersChatsModel.bulkCreate([
                { userEmail: adminEmail, chatId: chat.chatId },
                { userEmail: authorEmail, chatId: chat.chatId },
                { userEmail: userEmail, chatId: chat.chatId }
            ], { transaction: t });
            chatUsers.push(authorEmail);
            chatUsers.push(userEmail);
        }
        //
        let reqUser = await userModel.findByPk(userEmail, {
            attributes: ['firstName', 'lastName'],
            raw: true
        });
        //
        const message = await messageModel.create(
            {
                senderEmail: userEmail,
                chatId: chat.chatId,
                content: `Refund Request from ${reqUser.firstName + " " + reqUser.lastName}`
            }, { transaction: t }
        );
        //
        let recipients = chatUsers.filter(user => user != userEmail);
        await Promise.all(recipients.map(recipient => {
            return refundMessageStatusModel.create({
                recipient: recipient,
                messageId: message.messageId
            }, { transaction: t });
        }));
        //
        await t.commit();
        //
        const chatData = await chatModel.findOne({
            where: { chatId: chat.chatId },
            include: [{
                model: userModel, attributes: ["firstName", "lastName", "email", "profilePic"]
            }]
        });
        //
        let response = await messageModel.findOne({
            attributes: ['messageId', 'content', 'contentType', 'createdAt'],
            where: {
                messageId: message.messageId
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
        });

        response.dataValues.sender = response.dataValues.user.dataValues;
        delete response.dataValues.user;
        response.dataValues.recipients = response.dataValues.refundMessageStatuses.map(r => {
            r.dataValues.user = r.dataValues.user.dataValues;
            return r.dataValues;
        });
        delete response.dataValues.refundMessageStatuses;
        //
        await joinRefundRoomAndEmitMessage(require('../../../../socket/shared').getSharedIO(), chat.chatId, chatUsers, chatData, response.dataValues);
        //
        let msg = 'requested Refund';
        await sendNotifications(require('../../../../socket/shared').getSharedIO(), userEmail, receiverEmails, 'refund', msg, chat.chatId);

        return res.status(201).send(responseObject("Refund Created", 201, data));
    } catch (error) {
        await t.rollback();
        console.log(error)
        return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
    }
}

const getAllRefunds = async (req, res) => {
    try {
        const userEmail = req.userEmail;
        const refunds = await serviceRefundModel.findAll({
            where: {
                requestingUser: userEmail,
            },

            ...includeAttribute
        })

        return res.status(200).send(responseObject("Successfully Reterived", 200, refunds))
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}

const getARefund = async (req, res) => {
    try {
        const refundId = req.params.refundId;
        const userEmail = req.userEmail

        const user = await userModel.findByPk(userEmail);

        if (user.role === "admin") {
            const refund = await serviceRefundModel.findOne({
                where: {
                    refundId,
                },
                ...includeAttribute
            });

            if (!refund) return res.status(404).send(responseObject("Id is not valid", 404, "", "Refund Id is not valid"))

            let chatId = await refundChatsModel.findOne({
                attributes: ['chatId'],
                where: {
                    refundTicket: refund.dataValues.ticketNumber
                }
            });

            refund.dataValues.chatId = chatId.dataValues.chatId;

            return res.status(200).send(responseObject("Successfully Reterieved", 200, refund));

        } else {
            const refund = await serviceRefundModel.findByPk(refundId, {
                ...includeAttribute
            });
            if (!refund) return res.status(404).send(responseObject("Id is not valid", 404, "", "Refund Id is not valid"))

            let chatId = await refundChatsModel.findOne({
                attributes: ['chatId'],
                where: {
                    refundTicket: refund.dataValues.ticketNumber
                }
            });

            refund.dataValues.chatId = chatId.dataValues.chatId;

            if (refund.service.user.email === userEmail) {
                return res.status(200).send(responseObject("Successfully Reterieved", 200, refund));
            } else if (refund.user.email === userEmail) {
                return res.status(200).send(responseObject("Successfully Reterieved", 200, refund));
            } else {
                return res.status(403).send(responseObject("Unauthorized To Access", 403, "", "You Dont Have Permission To Access"));
            }
        }
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}

const updateARefund = async (req, res) => {
    try {
        const { error, value } = validateUpdateRefund(req.body)
        if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message));

        const userEmail = req.userEmail
        const refundId = req.params.refundId;

        const refund = await serviceRefundModel.findOne({
            where: {
                refundId,
                requestingUser: userEmail
            },
            ...includeAttribute
        });
        if (!refund) return res.status(404).send(responseObject("Not Found", 404, "", "Refund Id Is Not Valid"));

        if (refund.status !== "Pending") return res.status(400).send(responseObject("Can't Update Status Once Changed From Pending", 400, "", "Can't Update Status Once Changed From Pending"))

        if (refund.status === "Closed") return res.status(400).send(responseObject("Can't Update Once It Is Closed", 400, "", "Status Can't Change Once Closed"))

        await refund.update({
            ...value
        })

        return res.status(200).send(responseObject("Ticket Update Succesfully", 200, refund))
    } catch (error) {
        console.log(error)
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}

module.exports = {
    createRefund,
    getAllRefunds,
    updateARefund,
    getARefund
}