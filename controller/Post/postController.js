const postModel = require("../../models/postModel");
const userModel = require('../../models/userModel.js')
const likepostModel = require("../../models/likepostModel.js")
const validateAddPost = require("../../joiSchemas/Post/postSchema");
const { uploadMultipleToCloudinary } = require('../../utils/cloudinary/cloudinary.js');
const commentModel = require("../../models/commentModel.js");
const { responseObject } = require("../../utils/responseObject/index.js");
const interest = require("../../models/interestModel.js");
const postInterestBridge = require("../../models/postInterestBridge.js");



const includeObj = {
  include: [
    {
      model: interest,
      through: {
        attributes: [] // Exclude the bridge data
      }
    },
    {
      model: userModel,
      attributes: ["firstName", "lastName", "profilePic", "email", "id"],
      where: { isBlocked: false }
    },
    {
      model: likepostModel, include: [{
        model: userModel, attributes: ["firstName", "lastName", "profilePic", "email", "id"],
        where: { isBlocked: false }
      }]
    },
    {
      model: commentModel, include: [{
        model: userModel, attributes: ["firstName", "lastName", "profilePic", "email", "id"],
        where: { isBlocked: false }
      }]
    },
  ]
}
// my post , userpost ,  addingPost  ,  allPosts  , delPost

const myPost = async (req, res) => {
  try {
    const userEmail = req.userEmail;
    let postData
    if (Object.keys(req.query).length > 0) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      postData = await postModel.findAll({
        where: { email: userEmail },
        limit,
        offset,
        ...includeObj
      });
    } else {
      postData = await postModel.findAll({
        where: { email: userEmail },
        ...includeObj
      });
    }
    if (postData.length === 0) return res
      .status(200)
      .json({ statusCode: 200, message: "All posts fetched", data: [] })
    const modifiedPosts = postData.map(post => ({
      ...post.toJSON(),
      likes: {
        count: post.likes.length,
        likes: post.likes
      },
      comments: {
        count: post.comments.length,
        comments: post.comments
      }
    }));
    const data = modifiedPosts.sort((a, b) => b.createdAt - a.createdAt)
    return res.status(200).json({
      statusCode: 200,
      message: "All posts fetched",
      data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const singlePost = async (req, res) => {
  try {
    const id = req.params.id
    const post = await postModel.findByPk(id, {
      ...includeObj
    })
    if (!post) return res.status(404).send(responseObject("Post not found", 404, "", "Id is not valid"))
    const data = {
      ...post.toJSON(),
      likes: {
        count: post.likes.length,
        likes: post.likes
      },
      comments: {
        count: post.comments.length,
        comments: post.comments
      },
    }
    return res.status(200).send(responseObject("Post found", 200, data,))
  } catch (error) {
    return res.status(500).send(responseObject("Server error", 500, "", "Interval server error"))
  }
}

const userPost = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await userModel.findOne({
      attributes: ["email"],
      where: {
        id: userId
      }
    });
    let postData;
    if (Object.keys(req.query).length > 0) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      postData = await postModel.findAll({
        where: { email: user.email },
        limit,
        offset,
        ...includeObj
      });
    } else {
      postData = await postModel.findAll({
        where: { email: user.email },
        ...includeObj
      });
    }
    if (postData.length === 0) return res.status(200).json({ statusCode: 200, message: "All posts fetched", data: [] })
    const modifiedPosts = postData.map(post => ({
      ...post.toJSON(),
      likes: {
        count: post.likes.length,
        likes: post.likes
      },
      comments: {
        count: post.comments.length,
        comments: post.comments
      }
    }));
    return res
      .status(200)
      .json(responseObject("All Posts Feteched", 200, modifiedPosts));
  } catch (error) {
    return res.status(500).send('Server Error')
  }
}

const addingPost = async (req, res) => {
  try {
    const { error, value: { postText, interests } } = validateAddPost(req.body)
    if (error) return res.status(400).send(responseObject(error.message, 400, null, error.message))  // yaha response obj nhi laga

    const userEmail = req.userEmail;
    const chkUser = await userModel.findByPk(userEmail)
    if (!chkUser) return res.status(400).send(responseObject("User not found", 400, null, "Email is not valid"))

    const validInterests = await interest.findAll({
      where: {
        id: interests
      }
    });


    if (!validInterests.length) return res.status(400).send(responseObject('No valid interests found', 400, null, 'No valid interests found'));// yaha response obj nhi laga


    const imagesUploadResponse = await uploadMultipleToCloudinary(req.files, "post")
    if (!imagesUploadResponse.isSuccess) return res.status(500).send(responseObject("Image Uplaod Error", 500, "", imagesUploadResponse.error));

    const imageUrls = imagesUploadResponse.data
    const postAdd = await postModel.create({
      email: userEmail,
      postText,
      images: imageUrls,
    });
    const postInterestData = validInterests.map(interest => ({
      postId: postAdd.postId,
      interestId: interest.id
    }));
    // Bulk create the postInterestBridge records
    await postInterestBridge.bulkCreate(postInterestData);
    const temp = await postModel.findByPk(postAdd.postId, {
      ...includeObj
    })
    return res.status(201).json({
      statusCode: 201,
      message: "Post Added Successfully",
      postAdd: {
        ...temp.dataValues,
        images: JSON.parse(postAdd.dataValues.images),
        likes: {
          count: 0,
          likes: []
        },
        comments: {
          count: 0,
          comments: []
        }
      },
    });
  } catch (error) {
    return res.status(500).json({ // yaha response obj nhi laga
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const allPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const allPostsData = await postModel.findAll({
      order: [["createdAt", "DESC"]],
      ...includeObj
    });
    const paginatedPosts = allPostsData.slice(offset, offset + limit);
    if (paginatedPosts.length === 0) {
      return res.status(200).json({ statusCode: 200, message: "No Post Found", data: paginatedPosts });
    }
    // Modify the post data as needed
    const modifiedPosts = paginatedPosts.map(post => ({
      ...post.toJSON(),
      likes: {
        count: post.likes.length,
        likes: post.likes
      },
      comments: {
        count: post.comments.length,
        comments: post.comments
      }
    }));
    return res.status(200).json(responseObject("All posts fetched", 200, modifiedPosts));
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Server Error');
  }
};


const delPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await postModel.findByPk(postId, {
      ...includeObj
    })
    if (!post) return res.status(404).send('Post not found')
    const userEmail = req.userEmail;
    if (post.email !== userEmail) return res.status(401).send("No Persmission to Delete Post")
    // for (let image in post.images) {
    //   console.log(post.images[image]);
    //   const cloudinaryResponse = await deleteFromCloudinary(post.images[image])
    //   if (cloudinaryResponse.error) return res.status(500).send({ message: "Can't delete at the moment", status: 500 })
    // }
    await post.destroy();
    return res.send({ message: 'Post Deleted Successfully', status: 200, data: post })
  } catch (error) {
    console.log(error);
    return res.status(500).send('Server Error')
  }
}


module.exports = { addingPost, myPost, allPosts, delPost, userPost, singlePost };