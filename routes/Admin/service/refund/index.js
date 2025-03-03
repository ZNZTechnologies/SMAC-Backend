const express = require('express');
const { getAllRefunds, updateARefund, getARefund } = require('../../../../controller/Admin/service/refund');

const serviceRefundRouter = express.Router()


serviceRefundRouter.get("/refunds", getAllRefunds)
serviceRefundRouter.put("/refunds/:refundId", updateARefund)
serviceRefundRouter.get("/refunds/:refundId", getARefund)


module.exports = serviceRefundRouter