const { authenticationSecret } = require("../middleware/socketAuthentication");
const {
  handleSendMessage,
  handleDisconnect,
  handleJoinRoom,
  handleUserStatus,
  handleUndeliveredMessages,
  handleConnectedUser,
  handleUndeliveredNotifications,
  handleNotificationRead,
  handleClearNotifications,
  joinUserRooms,
  handleSendRefundMessage,
} = require("./handlers");

const createSocketServer = (io) => {
  io.use(authenticationSecret);

  io.on("connection", async (socket) => {
    const chk = await handleConnectedUser(socket);

    socket.join(socket.userEmail);

    if (!chk) {
      await handleUserStatus(socket);
      await joinUserRooms(socket);
      // await handleUndeliveredMessages(socket, io) // we are not using this anymore
      await handleUndeliveredNotifications(socket, io);
    }

    // socket.on("joinRoom", async (data) => {
    //     await handleJoinRoom(socket, data); // we are not using this yet
    // })

    socket.on("sendMessage", async (messageData) => {
      await handleSendMessage(socket, messageData, io);
    });

    socket.on("sendRefundMessage", async (messageData) => {
      await handleSendRefundMessage(socket, messageData, io);
    });

    socket.on("disconnect", async () => {
      await handleDisconnect(socket);
    });

    socket.on("notificationRead", async (data) => {
      await handleNotificationRead(socket, data);
    });

    socket.on("clearNotifications", async (data) => {
      await handleClearNotifications(socket, data);
    });
  });
};

module.exports = createSocketServer;
