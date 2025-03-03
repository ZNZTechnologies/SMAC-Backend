const Joi = require("joi");
const { Op, Sequelize, literal } = require("sequelize");
const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel");

const messageModel = require("../models/messageModel");
const { responseObject } = require("../utils/responseObject");
const usersChatsModel = require("../models/usersChatsModel");
const notificationModel = require("../models/notificationsModel");
const refundUsersChatsModel = require("../models/refundUsersChatsModel");
const refundMessageStatusModel = require("../models/refundMessageStatusModel");
const refundMessagesModel = require("../models/refundMessagesModel");
const { sendNotifications } = require("./helpers");
const { setConnectedUsers, getConnectedUsers } = require("./shared");

const handleConnectedUser = async (socket) => {
  const onlineUsers = await userModel.findAll({
    attributes: ["email", "socketId"],
    where: {
      isOnline: true,
    },
    raw: true,
  });
  //
  if (onlineUsers) {
    setConnectedUsers(onlineUsers);
  } else {
    setConnectedUsers([]);
  }
  //
  return getConnectedUsers().find((user) => {
    if (user.email === socket.userEmail && user.socketId === socket.id)
      return true;
    return false;
  });
};

const handleSendRefundMessage = async (socket, messageData, io) => {
  try {
    const userEmail = socket.userEmail;

    const { room, msgContent, msgType } = messageData; // room == chatId

    const message = await refundMessagesModel.create({
      senderEmail: userEmail,
      chatId: room,
      content: msgContent,
      contentType: msgType,
    });

    let chatUsers = await refundUsersChatsModel.findAll({
      attributes: ["userEmail"],
      where: {
        chatId: room,
      },
    });

    chatUsers = chatUsers.map((user) => user.userEmail);

    const recipients = chatUsers.filter((user) => user != userEmail);

    await Promise.all(
      recipients.map((recipient) => {
        return refundMessageStatusModel.create({
          recipient: recipient,
          messageId: message.messageId,
        });
      })
    );

    let response = await refundMessagesModel.findOne({
      attributes: ["messageId", "content", "contentType", "createdAt"],
      where: {
        messageId: message.messageId,
      },
      include: [
        {
          model: userModel,
          attributes: ["email", "firstName", "lastName", "profilePic"],
        },
        {
          model: refundMessageStatusModel,
          attributes: ["isRead"],
          include: {
            model: userModel,
            attributes: ["email", "firstName", "lastName", "profilePic"],
          },
        },
      ],
    });

    response.dataValues.sender = response.dataValues.user.dataValues;
    delete response.dataValues.user;
    response.dataValues.recipients =
      response.dataValues.refundMessageStatuses.map((r) => {
        r.dataValues.user = r.dataValues.user.dataValues;
        return r.dataValues;
      });
    delete response.dataValues.refundMessageStatuses;

    io.to(room).emit(
      "newRefundMessage",
      responseObject("message created", 201, response.dataValues)
    );

    const msg = "sent a message in refund chat";
    await sendNotifications(io, userEmail, recipients, "refund", msg, room);
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Server Error", 500, "", error)
    );
  }
};

const handleSendMessage = async (socket, messageData, io) => {
  try {
    const userEmail = socket.userEmail;

    const schema = Joi.object({
      chatId: Joi.string().max(255),
      content: Joi.string().max(255).required(),
      receiverEmail: Joi.string().max(255),
    }).xor("chatId", "receiverEmail");

    const {
      error,
      value: { chatId, content, receiverEmail },
    } = schema.validate(messageData);
    if (error)
      return socket.emit(
        "socketError",
        responseObject(error.message, 400, "", error.message)
      );

    if (chatId) {
      await sendMessageToExistingChat(socket, io, userEmail, content, chatId);
    } else {
      let userChats = await usersChatsModel.findAll({
        where: {
          userEmail,
        },
        attributes: ["chatId"],
      });

      if (!userChats || userChats.length < 1) {
        // user doesnt have any chat
        await sendMessageToNewChat(
          socket,
          io,
          userEmail,
          content,
          receiverEmail
        );
      } else {
        // find if user have a chat with target-user
        userChats = userChats.map((userChat) => userChat.dataValues.chatId);
        //
        let targetChat = await usersChatsModel.findOne({
          where: {
            [Op.and]: [
              { userEmail: receiverEmail },
              { chatId: { [Op.in]: userChats } },
            ],
          },
        });
        //
        if (!targetChat) {
          await sendMessageToNewChat(
            socket,
            io,
            userEmail,
            content,
            receiverEmail
          );
        } else {
          targetChat = targetChat.dataValues.chatId;
          console.log("target-chat-id >>>> ", targetChat);
          await sendMessageToExistingChat(
            socket,
            io,
            userEmail,
            content,
            targetChat
          );
        }
      }
    }
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Server Error", 500, "", error)
    );
  }
};

const sendMessageToExistingChat = async (
  socket,
  io,
  userEmail,
  content,
  chatId
) => {
  try {
    const userInChat = await usersChatsModel.findOne({
      where: {
        userEmail,
        chatId,
      },
    });

    if (!userInChat) {
      return socket.emit(
        "socketError",
        responseObject(
          "User is not part of the chat",
          400,
          "",
          "Invalid Chat Id"
        )
      );
    }

    const chat = await chatModel.findByPk(chatId);
    if (!chat)
      return socket.emit(
        "socketError",
        responseObject("Chat not found", 400, "", "Chat id is not valid")
      );

    const data = await messageModel.create({
      senderEmail: userEmail,
      chatId: chat.chatId,
      content: content,
    });

    const temp = await messageModel.findByPk(data.messageId, {
      include: [
        {
          model: userModel,
          attributes: ["firstName", "lastName", "email", "profilePic"],
        },
      ],
    });

    console.log(">>>>>>>>> sending message to existing chat");
    io.to(chat.chatId).emit(
      "newMessage",
      responseObject("message created", 201, temp)
    );

    const chatUsers = await usersChatsModel.findAll({
      where: { chatId: chat.chatId },
      raw: true,
      attributes: ["userEmail"],
    });

    chatUsers.forEach(async (chatUser) => {
      if (!chatUser.isOnline) {
      } else {
        await temp.update({ isSent: true });
      }

      io.to(chatUser.userEmail).emit(
        "notifyMessage",
        responseObject("message created", 201, temp)
      );
      if (chatUser.userEmail !== socket.userEmail) {
        await sendNewMessageNotification(
          data.chatId,
          chatUser.userEmail,
          socket,
          io
        );
      }
    });
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Server Error", 500, "", error)
    );
  }
};

const sendMessageToNewChat = async (
  socket,
  io,
  userEmail,
  content,
  receiverEmail
) => {
  try {
    const receiverUser = await userModel.findOne({
      where: { email: receiverEmail },
    });
    if (!receiverUser)
      return socket.emit(
        "socketError",
        responseObject("Receiver not found", 400)
      );

    async function findChatId(userEmail, receiverEmail) {
      try {
        const chatIds = await usersChatsModel.findAll({
          where: {
            userEmail: {
              [Op.in]: [userEmail, receiverEmail],
            },
          },
          attributes: ["chatId"],
          group: ["chatId"],
          having: literal("COUNT(chatId) = 2"),
        });

        if (chatIds.length > 0) {
          // Assuming there is only one chatId where both users are present
          return chatIds[0].chatId;
        } else {
          // No chat found with both users
          return null;
        }
      } catch (error) {
        console.error("Error finding chatId:", error);
        throw error;
      }
    }

    const chatId = await findChatId(userEmail, receiverEmail);

    if (chatId)
      return socket.emit(
        "socketError",
        responseObject(
          "Chat Is Already Created Between Users",
          400,
          "",
          "Can't Create Already Created Chat"
        )
      );

    const chat = await chatModel.create({});

    await usersChatsModel.bulkCreate([
      { userEmail, chatId: chat.chatId },
      { userEmail: receiverEmail, chatId: chat.chatId },
    ]);

    const data = await messageModel.create({
      senderEmail: userEmail,
      chatId: chat.chatId,
      content: content,
    });

    const temp = await messageModel.findByPk(data.messageId, {
      include: [
        {
          model: userModel,
          attributes: ["firstName", "lastName", "email", "profilePic"],
        },
      ],
      attributes: { exclude: ["senderEmail"] },
    });

    // io.to(chatId).emit("newMessage", responseObject("message created", 201, temp));

    const chatUsers = await usersChatsModel.findAll({
      where: { chatId: chat.chatId },
      raw: true,
      attributes: ["userEmail"],
    });

    const chatData = await chatModel.findOne({
      where: { chatId: chat.chatId },
      include: [
        {
          model: userModel,
          attributes: ["email", "firstName", "lastName", "profilePic"],
        },
      ],
    });

    console.log(">>>>>>>>> sending message to new chat");
    console.log("chatUsers", chatUsers);
    chatUsers.forEach(async (chat) => {
      console.log(chat, "chatUsers");
      const otherUser = chatData.users.find(
        (user) => user.email !== chat.userEmail
      );
      const users = [];
      users.push(otherUser);
      io.sockets.in(chat.userEmail).emit(
        "newChat",
        responseObject("message created", 201, {
          ...chatData.toJSON(),
          users,
        })
      );
      io.to(chat.userEmail).emit(
        "notifyMessage",
        responseObject("message created", 201, temp)
      );
      //
      if (chat.userEmail !== socket.userEmail) {
        await sendNewMessageNotification(
          data.chatId,
          chat.userEmail,
          socket,
          io
        );
      }
    });
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Server Error", 500, "", error)
    );
  }
};

const handleDisconnect = async (socket) => {
  setConnectedUsers(
    getConnectedUsers().filter((user) => user.email !== socket.userEmail)
  );
  //
  await userModel.update(
    {
      isOnline: false,
      lastSeen: Sequelize.literal("CURRENT_TIMESTAMP"),
      socketId: null,
    },
    { where: { email: socket.userEmail } }
  );
};

const handleJoinRoom = async (socket, data) => {
  try {
    const { chatId } = data;

    const userChats = await usersChatsModel.findAll({
      where: { userEmail: socket.userEmail },
      attributes: ["chatId"],
    });

    // Extract chat IDs
    const chatIds = userChats.map((userChat) => userChat.chatId);

    // Find all chats with the given chat IDs and include associated users
    const chats = await chatModel.findAll({
      where: { chatId: { [Op.in]: chatIds } },
      include: [{ model: userModel, attributes: ["email", "firstName"] }],
    });

    if (!chats.filter((chat) => chat.chatId === chatId).length) {
      socket.emit(
        "socketError",
        responseObject(
          "Can't connect to this room",
          400,
          "",
          "This user is not part of the chat"
        )
      );
      return;
    }

    return socket.join(chatId);
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Server Error", 400, "", error)
    );
  }
};

const handleUserStatus = async (socket) => {
  setConnectedUsers([
    ...getConnectedUsers(),
    { email: socket.userEmail, socketId: socket.id },
  ]);
  //
  await userModel.update(
    {
      isOnline: true,
      socketId: socket.id,
    },
    { where: { email: socket.userEmail } }
  );
};

const joinUserRooms = async (socket) => {
  try {
    const userChats = await refundUsersChatsModel.findAll({
      attributes: ["chatId"],
      where: { userEmail: socket.userEmail },
    });

    const chatIds = userChats.map((userChat) => userChat.chatId);

    chatIds.forEach((chatId) => {
      socket.join(chatId);
    });
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Server Error", 400, "", error)
    );
  }
};

const handleUndeliveredMessages = async (socket, io) => {
  const allMessages = await messageModel.findAll({
    where: {
      [Op.and]: {
        isSent: false,
        createdAt: {
          [Op.between]: [
            Sequelize.literal(
              `(SELECT \`lastSeen\` FROM \`users\` WHERE \`users\`.\`email\` = '${socket.userEmail}')`
            ),
            Sequelize.fn("NOW"),
          ],
        },
      },
      senderEmail: {
        [Op.not]: socket.userEmail,
      },
    },
    include: [
      {
        model: chatModel,
        include: [
          {
            model: userModel,
            attributes: [
              "email",
              "firstName",
              "lastName",
              "profilePic",
              "lastSeen",
            ],
            where: {
              email: socket.userEmail,
            },
          },
        ],
      },
    ],
    include: [
      {
        model: userModel,
        attributes: [
          "email",
          "firstName",
          "lastName",
          "profilePic",
          "lastSeen",
        ],
      },
    ],
  });

  io.to(socket.userEmail).emit("unReadMessages", allMessages);

  const messageIds = allMessages.map((message) => message.messageId);
  // Step 3: Update the isSent field to true
  await messageModel.update(
    { isSent: true },
    {
      where: {
        messageId: {
          [Op.in]: messageIds,
        },
      },
    }
  );
};

const handleUndeliveredNotifications = async (socket, io) => {
  try {
    let allNotifications = await notificationModel.findAll({
      attributes: ["id", "referenceId", "type", "message", "createdAt"],
      where: {
        receiverEmail: socket.userEmail,
        isRead: false,
      },
      include: {
        model: userModel,
        as: "sender",
        attributes: ["id", "email", "firstName", "lastName", "profilePic"],
        where: {
          email: {
            [Op.not]: socket.userEmail,
          },
        },
      },
      order: [["createdAt", "DESC"]],
    });

    allNotifications = allNotifications.map((n) => {
      n.dataValues.sender = n.dataValues.sender.dataValues;
      return n.dataValues;
    });

    io.to(socket.userEmail).emit("unReadNotifications", allNotifications);
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Cannot get notifications", 400, "", error)
    );
  }
};

const handleNotificationRead = async (socket, data) => {
  const notificationId = data.notificationId;
  try {
    await notificationModel.update(
      { isRead: true },
      {
        where: { id: notificationId },
      }
    );
    // if needed, send succes response below
    // io.to(socket.userEmail).emit("eventName", { message: 'Success' });
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Cannot clear this notification", 400, "", error)
    );
  }
};

const handleClearNotifications = async (socket, data) => {
  const notificationIds = data.notificationIds;
  try {
    await notificationModel.update(
      { isRead: true },
      {
        where: {
          id: {
            [Op.in]: notificationIds,
          },
        },
      }
    );
    // if needed, send succes response below
    // io.to(socket.userEmail).emit("eventName", { message: 'Success' })
  } catch (error) {
    return socket.emit(
      "socketError",
      responseObject("Cannot clear notifications", 400, "", error)
    );
  }
};

const sendNewMessageNotification = async (
  chatId,
  receiverEmail,
  socket,
  io
) => {
  let notification = await notificationModel.create({
    referenceId: chatId, // can be used to lead user to the target chat
    type: "message",
    message: `${
      socket.user.firstName + " " + socket.user.lastName
    } sent a message`,
    senderEmail: socket.user.email,
    receiverEmail: receiverEmail,
  });

  if (notification) {
    let payLoad = {
      id: notification.dataValues.id,
      referenceId: notification.dataValues.referenceId,
      type: notification.dataValues.type,
      message: notification.dataValues.message,
      createdAt: notification.dataValues.createdAt,
      sender: {
        id: socket.user.id,
        email: socket.user.email,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        profilePic: socket.user.profilePic,
      },
    };
    console.log(">>>>>>>>> sending notification");
    io.to(receiverEmail).emit("newNotification", payLoad);
  }
};

module.exports = {
  joinUserRooms,
  handleConnectedUser,
  handleSendMessage,
  handleSendRefundMessage,
  handleDisconnect,
  handleJoinRoom,
  handleUserStatus,
  handleUndeliveredMessages,
  handleUndeliveredNotifications,
  handleNotificationRead,
  handleClearNotifications,
};
