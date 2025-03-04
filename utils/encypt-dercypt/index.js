
const crypto = require('crypto');

function hashPassword(password) {
    const hash = crypto.pbkdf2Sync(password, 'MY_SECRET', 100000, 64, 'sha512').toString('hex');
    console.log('hash >>>', hash)
    return hash;
}

function verifyPassword(password, storedHash) {
    const hashedPassword = hashPassword(password);
    return hashedPassword === storedHash;
}

module.exports = {
    hashPassword,
    verifyPassword
}
