const express = require("express");
const {
  checkJWT,
  adminCheckJWT,
} = require("../middleware/authenticationMiddleware");
const checkExistingToken = require("../middleware/previousToken");

const router = express.Router();

const authR = require("../routes/Auth/auth");
const adminR = require("../routes/Admin/index");
const userR = require("../routes/User/userRoutes");
const storyR = require("../routes/Story/story");
const postR = require("../routes/Post/postRoutes");
const likeR = require("../routes/Like/likeRoutes");
const postCommentR = require("../routes/PostComment/postComment");
const tokenR = require("../routes/Token/token");
const coursesR = require("../routes/Course/course");
const followerR = require("../routes/Follower/follower");
const productR = require("../routes/Product/product");
const interestR = require("../routes/Admin/interest");
const refundR = require("./Course/Refund");

const adminGetRoutes = require("./getRoutes");
const courseMainRoute = require("./Course");
const chatR = require("./Chat");
const refundChatR = require("./RefundChat");
const globalSearchR = require("./GlobalSearch");
const openRoutes = require("./Open");
const subscriptionRoute = require("./Subscription/index");
const serviceRouter = require("./Service");
const refundTicketsR = require("../routes/RefundTickets"); // temporary

router.use("/open", openRoutes); //that is a route if user want to access information without loggin in
router.use("/user", userR);
router.use("/auth/user", authR);

router.use("/validatetoken", checkExistingToken, checkJWT, tokenR);

// chk krna
router.use("/", checkExistingToken, checkJWT, adminGetRoutes);
router.use("/admin", adminCheckJWT, adminR);

router.use("/user/story", checkExistingToken, checkJWT, storyR);
router.use("/user/post", checkExistingToken, checkJWT, postR);
router.use("/user/post/like", checkExistingToken, checkJWT, likeR);
router.use("/user/post/comment", checkExistingToken, checkJWT, postCommentR);
router.use("/user/connection", checkExistingToken, checkJWT, followerR);

router.use("/course", checkExistingToken, checkJWT, courseMainRoute);

router.use("/product", checkExistingToken, checkJWT, productR);

router.use("/interest", checkExistingToken, checkJWT, interestR);
router.use("/chat", checkExistingToken, checkJWT, chatR);
router.use("/refundchat", checkExistingToken, checkJWT, refundChatR);
router.use("/search", checkExistingToken, checkJWT, globalSearchR);

router.use("/subscription", checkExistingToken, checkJWT, subscriptionRoute);
router.use("/service", checkExistingToken, checkJWT, serviceRouter);
router.use("/refundTickets", refundTicketsR); // temporary

module.exports = router;