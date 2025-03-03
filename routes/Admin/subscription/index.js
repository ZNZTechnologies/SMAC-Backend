
const express = require('express')
const subscriptionAdminRouter = express.Router()
const { handleMulterUpload, handleMulterUploadForImageUpdate } = require('../../../middleware/multer')
const { createSubscription, updateSubscription } = require('../../../controller/Admin/subscription')

subscriptionAdminRouter.post("/create", handleMulterUpload('icon', true), createSubscription)
subscriptionAdminRouter.put("/update/:id", handleMulterUploadForImageUpdate([
    { name: "icon", maxCount: 1 }
  ]), updateSubscription)

module.exports = subscriptionAdminRouter
