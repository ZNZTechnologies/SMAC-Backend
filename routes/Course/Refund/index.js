const express = require('express');
const { createRefund, getAllRefunds, updateARefund, getARefund } = require('../../../controller/Course/Refund');

const courseRefundRouter = express.Router()

courseRefundRouter.post("/:orderId/refunds", createRefund);
courseRefundRouter.get("/refunds", getAllRefunds)
courseRefundRouter.get("/refunds/:refundId", getARefund)
courseRefundRouter.put("/refunds/:refundId", updateARefund)


module.exports = courseRefundRouter