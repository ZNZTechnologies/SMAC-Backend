
let io = null;
let connectedUser = new Array();

function setSharedIO(value) {
    io = value;
}

function getSharedIO() {
    return io;
}

function setConnectedUsers(list) {
    connectedUser = list;
}

function getConnectedUsers() {
    return connectedUser;
}

module.exports = {
    setSharedIO,
    getSharedIO,
    setConnectedUsers,
    getConnectedUsers
}
