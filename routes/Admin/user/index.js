const express = require('express')
const userAdminRouter = express.Router()

const { getAllUser, updateUser, getSingleUser } = require('../../../controller/Admin/user')

userAdminRouter.get("/", getAllUser)
userAdminRouter.put('/', updateUser)
userAdminRouter.get("/:filter", getSingleUser)

module.exports = userAdminRouter