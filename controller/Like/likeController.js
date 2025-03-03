const userModel = require("../../models/userModel");
const postModel = require("../../models/postModel");
const likePostModel = require("../../models/likepostModel");
const validateLike = require("../../joiSchemas/Like/likeSchema");
const { responseObject } = require("../../utils/responseObject");


const likePost = async (req, res) => {

  const { error, value: { postId } } = validateLike(req.body)
  if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message));
  const userEmail = req.userEmail;
  try {
    const postExist = await postModel.findOne({
      where: { postId: postId },
      include :[{
        model: userModel,
        attributes: [
          "email",
          "profilePic",
          "firstName",
          "lastName",
        ],
        where:{isBlocked:false}
      }]
    });
    if (!postExist) {
      return res.status(404).send(responseObject("post not found", 404, "", "post not found"));
    }
    // Check if the user has already liked the post
    const existingLike = await likePostModel.findOne({
      where: {
        userEmail,
        postId: postId,
      }
    });
    if (existingLike) {
      await existingLike.destroy()
      return res.status(200).send(responseObject("Unliked", 200, existingLike));
    }
    else {
      const addLike = await likePostModel.create({
        userEmail,
        postId,
      });
      return res.status(200).send(responseObject("liked", 200, addLike));
    }
  } catch (error) {
    console.error("Internal server error - likePost Controller", error);
    return res.status(500).send(responseObject("Internal server error", 500, "", error.message));
    
  }
};


module.exports = { likePost };