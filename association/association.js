const userModel = require("../models/userModel");
const userDetailsModel = require("../models/userAdditionalInformation");
const postModel = require("../models/postModel");
const storyModel = require('../models/storiesModel')
const storyViewModel = require('../models/storiesViewModel')
const courseModel = require('../models/courseModel')
const followerModel = require("../models/followerModel")
const productModel = require("../models/product");
const courseParentCategory = require("../models/courseParentCategory");
const courseSubCategory = require("../models/courseSubCategory");
const courseSubCategoryBridge = require("../models/courseSubCategoryBridge");
const productParentCategory = require("../models/productParentCategory");
const productSubCategory = require("../models/productSubCategory");
const productSubCategoryBridge = require("../models/productSubCategoryBridge");
const postinterestBridge = require("../models/postInterestBridge");
const interest = require("../models/interestModel");
const userInterest = require("../models/userInterest");
const courseOrder = require("../models/courseOrder");
const courseRefundModel = require("../models/courseRefundModel");
const postLikeModel = require("../models/likepostModel");
const commentModel = require("../models/commentModel");
const messageModel = require("../models/messageModel");
const chatModel = require("../models/chatModel");
const usersChatsModel = require("../models/usersChatsModel");
const subscription = require("../models/subscriptionModel");
const benefit = require("../models/benefitsModel");
const plan = require("../models/plansModel");
const service = require("../models/serviceModel");
const deliverable = require("../models/deliverableModel");
const serviceParentCategory = require("../models/serviceParentCategory");
const serviceSubCategory = require("../models/serviceSubCategory");
const serviceSubCategoryBridge = require("../models/serviceSubCategoryBridge");
const serviceOrder = require("../models/serviceOrder");
const serviceRefund = require("../models/serviceRefundModel");
const notificationModel = require("../models/notificationsModel");
const refundChatsModel = require("../models/refundChatsModel");
const refundMessagesModel = require("../models/refundMessagesModel");
const refundUsersChatsModel = require("../models/refundUsersChatsModel");
const refundMessageStatusModel = require("../models/refundMessageStatusModel");
const userSearchesModel = require("../models/userSearchesModel");
const paymentModel = require("../models/paymentModel");


// const storyModel = require("../models/storiesModel")


console.log("association called")

// post with likes

postLikeModel.belongsTo(postModel, { foreignKey: "postId", })

postModel.hasMany(postLikeModel, { foreignKey: "postId", })

//association between post and comment

commentModel.belongsTo(postModel, { foreignKey: "postId", targetKey: "postId" })

postModel.hasMany(commentModel, { foreignKey: "postId", })

// association of comment with user
commentModel.belongsTo(userModel, { foreignKey: "userEmail", })

userModel.hasMany(commentModel, { foreignKey: "userEmail", })


// Define association between users and userDetails
userDetailsModel.belongsTo(userModel, { foreignKey: "email", });

userModel.hasOne(userDetailsModel, { foreignKey: "email", });

// association between users and posts
userModel.hasMany(postModel, { foreignKey: "email", });
postModel.belongsTo(userModel, { foreignKey: "email", });


// user with like

postLikeModel.belongsTo(userModel, { foreignKey: "userEmail", })

userModel.hasMany(postLikeModel, { foreignKey: "userEmail", })


storyViewModel.belongsTo(storyModel, { foreignKey: 'storyId' });
// // Define association between StoryView and User
storyViewModel.belongsTo(userModel, { foreignKey: 'userEmail' });

// // Define association between Story and StoryView (optional)
storyModel.hasMany(storyViewModel, { foreignKey: 'storyId' });


// courseModel association between userModel
courseModel.belongsTo(userModel, { foreignKey: 'authorEmail', targetKey: 'email' });


// follower model association with user
followerModel.belongsTo(userModel, { foreignKey: 'userEmail', targetKey: 'email' });
followerModel.belongsTo(userModel, { foreignKey: 'followingEmail', targetKey: 'email' });


// product model association with user
productModel.belongsTo(userModel, { foreignKey: 'authorEmail', targetKey: 'email' });

// story model association with user
storyModel.belongsTo(userModel, { foreignKey: 'userEmail', targetKey: 'email' });

 // user to payments
userModel.hasMany(paymentModel, { foreignKey: "userEmail", as: "payments" });
paymentModel.belongsTo(userModel, { foreignKey: "userEmail", as: "paymentUser" });

// courses
// course to parentCategory
courseModel.belongsTo(courseParentCategory, { foreignKey: 'parentCategory', targetKey: "courseParentCategoryId" })

// course to subCategory with brige table
courseModel.belongsToMany(courseSubCategory, { through: courseSubCategoryBridge, as: 'subCategories', foreignKey: 'courseId' });
courseSubCategory.belongsToMany(courseModel, { through: courseSubCategoryBridge, as: 'courses', foreignKey: 'subCategoryId' });

// course sub category to course parent category
courseSubCategory.belongsTo(courseParentCategory, { foreignKey: "parentCategoryId", targetKey: "courseParentCategoryId" })


// products
// product to parentCategory
productModel.belongsTo(productParentCategory, { foreignKey: 'parentCategory', targetKey: "productParentCategoryId" })

// // product to subCategory with brige table
productModel.belongsToMany(productSubCategory, { through: productSubCategoryBridge, as: 'subCategories', foreignKey: 'productId' });
productSubCategory.belongsToMany(productModel, { through: productSubCategoryBridge, as: 'products', foreignKey: 'subCategoryId' });

// // product sub category to course parent category
productSubCategory.belongsTo(productParentCategory, { foreignKey: "parentCategoryId", targetKey: "productParentCategoryId" })


//interest post
postModel.belongsToMany(interest, {
    through: postinterestBridge,
    foreignKey: "postId",
    otherKey: "interestId"
});

interest.belongsToMany(postModel, {
    through: postinterestBridge,
    foreignKey: "interestId",
    otherKey: "postId"
});



// postModel.belongsToMany(interest, { through: postinterestBridge, foreignKey: "postId" });
// interest.belongsToMany(postModel, { through: postinterestBridge, foreignKey: "interestId" });


// user with interest
userDetailsModel.belongsToMany(interest, { through: userInterest, foreignKey: 'userEmail', as: 'interests' });
interest.belongsToMany(userDetailsModel, { through: userInterest, foreignKey: 'interestId', as: 'users' });


// course Order to user

courseOrder.belongsTo(userModel, { foreignKey: "userEmail", targetKey: "email" })
courseOrder.belongsTo(courseModel, { foreignKey: "courseId", targetKey: "courseId" })


// course refund to user order and course;
courseRefundModel.belongsTo(userModel, { foreignKey: "refundSupervisor", targetKey: "email" });
courseRefundModel.belongsTo(userModel, { foreignKey: "requestingUser", targetKey: "email" });
courseRefundModel.belongsTo(courseModel, { foreignKey: "courseId", targetKey: "courseId" });
courseRefundModel.belongsTo(courseOrder, { foreignKey: "orderId", targetKey: "orderId", as: "order" });




userModel.hasOne(messageModel, { foreignKey: "senderEmail" }); // hasMany
messageModel.belongsTo(userModel, { foreignKey: "senderEmail" });

messageModel.belongsTo(chatModel, {
    foreignKey: "chatId",
})

chatModel.hasMany(messageModel, {
    foreignKey: "chatId",
})


userModel.belongsToMany(chatModel, {
    through: usersChatsModel,
    foreignKey: 'userEmail',
    otherKey: 'chatId'
});

chatModel.belongsToMany(userModel, {
    through: usersChatsModel,
    foreignKey: 'chatId',
    otherKey: 'userEmail'
});

subscription.hasMany(benefit, { foreignKey: "subscriptionId", as: "benefits" });
benefit.belongsTo(subscription, { foreignKey: "subscriptionId", as: "subscription" });

subscription.hasMany(plan, { foreignKey: "subscriptionId", as: "plans" });
plan.belongsTo(subscription, { foreignKey: "subscriptionId", as: "subscription" });

plan.hasMany(userModel, { foreignKey: "subscriptionPlanId", as: "subscribers" });
userModel.belongsTo(plan, { foreignKey: "subscriptionPlanId", as: "subscriptionPlan" });

service.hasMany(deliverable, { foreignKey: "serviceId", as: "deliverables" });
deliverable.belongsTo(service, { foreignKey: "serviceId", as: "service" });

// services
// service to parentCategory
service.belongsTo(serviceParentCategory, { foreignKey: 'parentCategory', targetKey: "serviceParentCategoryId" })

// service to subCategory with brige table
service.belongsToMany(serviceSubCategory, { through: serviceSubCategoryBridge, as: 'subCategories', foreignKey: 'serviceId' });
serviceSubCategory.belongsToMany(service, { through: serviceSubCategoryBridge, as: 'services', foreignKey: 'subCategoryId' });

// service sub category to service parent category
serviceSubCategory.belongsTo(serviceParentCategory, { foreignKey: "parentCategoryId", targetKey: "serviceParentCategoryId" })

// serviceModel association between userModel
service.belongsTo(userModel, { foreignKey: 'authorId', targetKey: 'id' });

serviceOrder.belongsTo(userModel, { foreignKey: "userEmail", targetKey: "email" })
serviceOrder.belongsTo(service, { foreignKey: "serviceId", targetKey: "serviceId" })

// course refund to user order and course;
serviceRefund.belongsTo(userModel, { foreignKey: "refundSupervisor", targetKey: "email" });
serviceRefund.belongsTo(userModel, { foreignKey: "requestingUser", targetKey: "email" });
serviceRefund.belongsTo(service, { foreignKey: "serviceId", targetKey: "serviceId" });
serviceRefund.belongsTo(serviceOrder, { foreignKey: "orderId", targetKey: "orderId", as: "order" });

// association between users and notifications
userModel.hasMany(notificationModel, { foreignKey: "receiverEmail", as: "notifications_received" });
notificationModel.belongsTo(userModel, { foreignKey: "receiverEmail", as: "recipient" });
userModel.hasMany(notificationModel, { foreignKey: "senderEmail", as: "notifications_sent" });
notificationModel.belongsTo(userModel, { foreignKey: "senderEmail", as: "sender" });


userModel.hasMany(refundMessagesModel, { foreignKey: "senderEmail" }); // from hasOne
refundMessagesModel.belongsTo(userModel, { foreignKey: "senderEmail" });

refundMessagesModel.belongsTo(refundChatsModel, {
    foreignKey: "chatId",
})

refundChatsModel.hasMany(refundMessagesModel, {
    foreignKey: "chatId",
})

refundMessagesModel.hasMany(refundMessageStatusModel, { foreignKey: "messageId" });
refundMessageStatusModel.belongsTo(refundMessagesModel, { foreignKey: "messageId" });

userModel.hasOne(refundMessageStatusModel, { foreignKey: "recipient" });
refundMessageStatusModel.belongsTo(userModel, { foreignKey: "recipient" });

userModel.belongsToMany(refundChatsModel, {
    through: refundUsersChatsModel,
    foreignKey: 'userEmail',
    otherKey: 'chatId'
});

refundChatsModel.belongsToMany(userModel, {
    through: refundUsersChatsModel,
    foreignKey: 'chatId',
    otherKey: 'userEmail'
});

// user searches
userModel.hasMany(userSearchesModel, { foreignKey: "userEmail" });
userSearchesModel.belongsTo(userModel, { foreignKey: "userEmail" });
