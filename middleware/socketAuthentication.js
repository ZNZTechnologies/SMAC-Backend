const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const authenticationSecret = (socket, next) => {
    try {
        const token =  socket.handshake.auth.token || socket.handshake.headers.token;
        if (!token) {
            return next(new Error('Unauthorized: Token not available'));
        }

        jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
            if (err) {
                console.error("JWT verification failed:", err.message);
                return next(new Error('Unauthorized: Invalid token'));
            } else {
                socket.isPassReset = decoded.isPassReset ? true : false;
                socket.userEmail = decoded.email;
                const user = await userModel.findByPk(socket.userEmail);
                if (!user) {
                    return next(new Error("User doesn't exist"));
                }
                if (!socket.isPassReset && !user.isEmailVerified) {
                    return next(new Error('Unauthorized: Email Not Verified'));
                }
                if (user.isBlocked) {
                    return next(new Error("Blocked: Can't Access"));
                }
                socket.user = user.dataValues;
                next();
            }
        });
    } catch (error) {
        console.log(error);
        return next(new Error('Internal Server Error'));
    }


}


module.exports = { authenticationSecret }