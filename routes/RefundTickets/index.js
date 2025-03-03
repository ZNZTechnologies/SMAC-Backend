const express = require('express')
const { getAllRefunds, getUserRefunds, getSellerUserRefunds } = require('../../controller/RefundTickets')
const { adminCheckJWT, checkJWT } = require('../../middleware/authenticationMiddleware')
const checkExistingToken = require('../../middleware/previousToken')

const refundTicketsRouter = express.Router()


refundTicketsRouter.get('/admin', adminCheckJWT, getAllRefunds)
refundTicketsRouter.get('/nonAdmin/buyer', checkExistingToken, checkJWT, getUserRefunds)
refundTicketsRouter.get('/nonAdmin/seller', checkExistingToken, checkJWT, getSellerUserRefunds)


module.exports = refundTicketsRouter