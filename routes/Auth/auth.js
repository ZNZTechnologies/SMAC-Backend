const express = require("express");
const authRoutes = express.Router();
const { registerUser, registerSuperAdmin,deleteUser, loginUser, googleLoginPage, authGoogle, googleLoginController, googleCallback, verifyEmail, resendEmail } = require("../../controller/Auth/authController");
const { adminCheckJWT } = require("../../middleware/authenticationMiddleware");
const checkExistingToken = require("../../middleware/previousToken");



authRoutes.route('/verify-email').get(verifyEmail)
authRoutes.route('/resend-email').get(resendEmail)

authRoutes.route("/register-user").post(registerUser);
authRoutes.route('/register-super-admin').post(adminCheckJWT, checkExistingToken, registerSuperAdmin)
authRoutes.route("/login").post(loginUser);

authRoutes.route("/delete-user").delete(deleteUser);

authRoutes.route('/login/google').post(googleLoginController)



module.exports = authRoutes