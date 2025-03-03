const express = require('express');
const { createRefund, getAllRefunds, updateARefund, getARefund } = require('../../../controller/Order/Service/Refund/');

const serviceRefundRouter = express.Router()

serviceRefundRouter.post("/:orderId/refunds", createRefund);
serviceRefundRouter.get("/refunds", getAllRefunds)
serviceRefundRouter.get("/refunds/:refundId", getARefund)
serviceRefundRouter.put("/refunds/:refundId", updateARefund)

module.exports = serviceRefundRouter