const express = require("express");
const courseRefundRouter = require("./Refund");
const courseRouter = require("./course");

const courseMainRoute = express.Router()


courseMainRoute.use("/orders", courseRefundRouter)
courseMainRoute.use("/", courseRouter)


module.exports = courseMainRoute