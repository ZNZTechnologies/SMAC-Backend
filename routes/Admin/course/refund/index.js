const express = require('express');
const { getAllRefunds, updateARefund, getARefund } = require('../../../../controller/Admin/course/refund');

const courseRefundRouter = express.Router()


courseRefundRouter.get("/refunds", getAllRefunds)
courseRefundRouter.put("/refunds/:refundId", updateARefund)
courseRefundRouter.get("/refunds/:refundId", getARefund)


module.exports = courseRefundRouter