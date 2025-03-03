const express = require("express");
// const subscriptionBenefitsRoute = require("./Benefit/index");
const { createSubscription, getSubscription, getAllSubscriptions, updateSubscription, addSubscription, removeSubscription, changeSubscription } = require('../../controller/Subscription/index');
// const { handleMulterUpload, handleMulterUploadForImageUpdate } = require("../../middleware/multer");

const subscriptionRoute = express.Router()


// subscriptionRoute.use("/benefits", subscriptionBenefitsRoute)
//
// subscriptionRoute.post("/create", handleMulterUpload('icon', true), createSubscription)
subscriptionRoute.get("/retrieve/:id", getSubscription)
subscriptionRoute.get("/retrieve", getAllSubscriptions)
subscriptionRoute.post("/subscribe", addSubscription)
subscriptionRoute.post("/unsubscribe", removeSubscription)
subscriptionRoute.post("/changePlan", changeSubscription)
// subscriptionRoute.put("/update/:id", handleMulterUploadForImageUpdate([
//     { name: "icon", maxCount: 1 }
//   ]), updateSubscription)


module.exports = subscriptionRoute