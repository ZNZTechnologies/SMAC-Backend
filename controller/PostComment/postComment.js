const { validateCommentSchema, validateGetAllSchema, validateUpdateComment } = require("../../joiSchemas/PostComment/postComment");
const commentModel = require("../../models/commentModel");
const postModel = require("../../models/postModel");
const userModel = require("../../models/userModel");
const { responseObject } = require("../../utils/responseObject");

// const modifyReturnObject = async (data) => {
//     try {
//         const newArr = await Promise.all(data.map(async (d) => {
//             try {
//                 const user = await userModel.findByPk(d.dataValues.userEmail)
//                 if (!user) return {}
//                 const { firstName, lastName, profilePic, email } = user
//                 return {
//                     ...d.dataValues,
//                     user: {
//                         firstName,
//                         lastName,
//                         profilePic,
//                         email
//                     }
//                 }
//             } catch (error) { }
//         }))
//         return newArr
//     } catch (error) {
//         return []
//     }
// }

const includeObj = {
    include: [
        { model: userModel, attributes: ["firstName", "lastName", "email", "profilePic", "id"] }
    ]
}


const getAllComments = async (req, res) => {
    try {
        const postId = req.params.id
        const comments = await commentModel.findAll({
            where: {
                postId
            },
            ...includeObj
        })

        // const data = await modifyReturnObject(comments)
        return res.status(200).send(responseObject("Comments received Successfully", 200, comments))
    } catch (error) {
        return res.status(500).send(responseObject("Server Error", 500, "", "Server Error"))
    }

}

const createComment = async (req, res) => {
    try {
        // const postId = req.params.postId

        const { error, value } = validateCommentSchema(req.body)
        if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))
        const post = await postModel.findOne({
            where: {
                postId: value.postId
            }
        });

        if (!post) return res.status(404).send(responseObject('No Post Found', 404, "", 'No Post Found'))
        const user = await userModel.findByPk(req.userEmail)
        if (!user) return res.status(404).send(responseObject('User not found', 404, "", 'User not found'))
        const comment = await commentModel.create({ commentText: value.commentText, userEmail: req.userEmail, postId: value.postId })
        const temp = await commentModel.findByPk(comment.commentId, {
            ...includeObj
        })
        return res.status(201).send(responseObject('Comment Added', 201, temp))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Server Error", 500, "", "Server Error"))
    }
}

const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id
        const comment = await commentModel.findByPk(commentId);

        if (!comment) return res.status(404).send(responseObject('Comment not found', 404, "", 'Comment not found'))
        await comment.destroy()
        return res.status(200).send({ message: 'Deleted Successfully', comment })
    } catch (error) {
        return res.status(500).send(responseObject("Server Error", 500, "", "Server Error"))
    }
}

const updateCommentText = async (req, res) => {
    try {
        const { error, value } = validateUpdateComment(req.body)
        if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))
        const commentId = req.params.id;

        const comment = await commentModel.findByPk(commentId)

        if (!comment) return res.status(404).send(responseObject('Comment Not Found', 404, "", 'Comment Not Found'))
        await comment.update({
            commentText: value.commentText
        });

        const temp = await commentModel.findByPk(commentId, {
            ...includeObj
        });
        return res.status(201).send(responseObject('Added Comment Succesfully', 201, temp))
    } catch (error) {
        return res.status(500).send(responseObject("Server Error", 500, "", "Server Error"))
    }
}


module.exports = { getAllComments, createComment, deleteComment, updateCommentText }