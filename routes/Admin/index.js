const express = require('express')
const adminMainRouter = express.Router();

const course = require('./course')
const product = require('./product')
const user = require('./user');
const courseRefundRouter = require('./course/refund');
const service = require('./service');
const serviceRefundRouter = require('./service/refund');
const subscriptionRouter = require('./subscription')



adminMainRouter.use("/course/orders", courseRefundRouter)
adminMainRouter.use("/course", course);
adminMainRouter.use("/product", product)
adminMainRouter.use("/user", user)
adminMainRouter.use("/service", service)
adminMainRouter.use("/service/orders", serviceRefundRouter)
adminMainRouter.use("/subscription", subscriptionRouter)


module.exports = adminMainRouter