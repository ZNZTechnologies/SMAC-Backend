
const express = require('express')
const { getAllChats, getAllMessagesOfAChat, uploadImages } = require('../../controller/RefundChat')
const { handleMulterUpload } = require('../../middleware/multer')

const refundChatRouter = express.Router()

// chatRouter.get('/', getAllChats)
refundChatRouter.get('/:refundTicket', getAllMessagesOfAChat)
refundChatRouter.post('/upload', handleMulterUpload("images[]", false, 10), uploadImages)

module.exports = refundChatRouter
