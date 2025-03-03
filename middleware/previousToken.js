const Token = require('../models/blacklistModel');
const { responseObject } = require('../utils/responseObject');

async function checkExistingToken(req, res, next) {
    // getting the token from the headers
    const authorizationHeader = req.headers.authorization;
    // if token is missing
    if (!authorizationHeader) {
        return res.status(401).send(responseObject('Unauthorized - Missing Authorization Header', 401, "", 'Unauthorized - Missing Authorization Header'))
    }
    // destructuring the token
    const [, currentToken] = authorizationHeader.split(' ');
    // invalid header format, passing in the wrong headers
    if (!currentToken) {
        return res.status(401).send(responseObject('Unauthorized - Invalid Authorization Header Format', 401, "", 'Unauthorized - Invalid Authorization Header Format'))
    }
    try {
        // Check if the current token exists in the database
        const tokenInDatabase = await Token.findOne({
            where: { token: currentToken },
        });
        if (tokenInDatabase) {
            // Deny access if the current token exists in the database
            return res.status(400).send(responseObject(err.message, 400, "", err.message))
        }
        // if everything is fine then, move next();
        // Continue with the next middleware or route handler
        next();
    } catch (error) {
        console.error(error);
        res.status(400).send(responseObject('Internal Server Error', 400, "", "error"))
    }
}
module.exports = checkExistingToken;