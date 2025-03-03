const express = require('express')
const { getAllChats, getAllMessagesOfAChat } = require('../../controller/Chat')

const chatRouter = express.Router()


chatRouter.get('/', getAllChats)
chatRouter.get('/:chatId', getAllMessagesOfAChat)



module.exports = chatRouter