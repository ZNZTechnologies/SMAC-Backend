const express = require("express");

const globalSearchRouter = express.Router();
const { responseObject } = require("../../utils/responseObject");
const userModel = require("../../models/userModel");
const postModel = require("../../models/postModel");
const courseModel = require("../../models/courseModel");
const productModel = require("../../models/product");
const likePostModel = require("../../models/likepostModel")
const { Op } = require("sequelize");
const interest = require("../../models/interestModel");
const commentModel = require("../../models/commentModel");
const courseParentCategory = require("../../models/courseParentCategory");
const courseSubCategory = require("../../models/courseSubCategory");
const productParentCategory = require("../../models/productParentCategory");
const productSubCategory = require("../../models/productSubCategory");
const userDetailsModel = require("../../models/userAdditionalInformation");
const serviceModel = require("../../models/serviceModel");
const serviceParentCategory = require("../../models/serviceParentCategory");
const serviceSubCategory = require("../../models/serviceSubCategory");
const userSearchesModel = require("../../models/userSearchesModel");

const postIncludeObj = {
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
            model: likePostModel, include: [{
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

const courseIncludeObj = {
    include: [
        {
            model: userModel,
            attributes: [
                "email",
                "profilePic",
                "coverPic",
                "firstName",
                "lastName",
                "bio",
                "id"
            ],
            where: { isBlocked: false }
        },
        {
            model: courseParentCategory,
            attributes: ["courseParentCategoryId", "name"],
        },
        {
            model: courseSubCategory,
            as: "subCategories",
            through: { attributes: [] },
        },
    ],
};

const productIncludeObj = {
    include: [
        { model: userModel, attributes: ['email', 'profilePic', 'coverPic', 'firstName', 'lastName', 'id'], where: { isBlocked: false } },
        { model: productParentCategory, attributes: ['productParentCategoryId', 'name'] },
        { model: productSubCategory, as: 'subCategories', through: { attributes: [] } }
    ],
    attributes: {
        exclude: ["parentCategory"]
    },
}

const serviceIncludeObj = {
    include: [
        { model: userModel, attributes: ['email', 'profilePic', 'coverPic', 'firstName', 'lastName', 'id'], where: { isBlocked: false } },
        { model: serviceParentCategory, attributes: ['serviceParentCategoryId', 'name'] },
        { model: serviceSubCategory, as: 'subCategories', through: { attributes: [] } }
    ],
    attributes: {
        exclude: ["parentCategory"]
    },
}


globalSearchRouter.get('/', async (req, res) => {

    try {


        const searchQuery = req.query.searchQuery;

        if (!searchQuery) return res.status(400).json(responseObject("searchQuery is required", 400, "", "searchQuery is required"));

        await userSearchesModel.create({
            userEmail: req.userEmail,
            keyWords: searchQuery,
            context: 'global'
        });

        const [users, posts, courses, products, services] = await Promise.all([
            userModel.findAll({
                where: {
                    [Op.or]: [
                        { firstName: { [Op.like]: `%${searchQuery}%` } },
                        { email: { [Op.like]: `%${searchQuery}%` } }
                    ]
                },
                attributes: ["firstName", "lastName", "email", "profilePic", "bio", "id"],
                include: [{ model: userDetailsModel, attributes: ["country"] }]
                // include:[]
                // include: ["firstName", "lastName", "profilePic", "email"]
            }),
            postModel.findAll({
                where: {
                    [Op.or]: [
                        { postText: { [Op.like]: `%${searchQuery}%` } }
                    ]
                },

                ...postIncludeObj
            }),
            courseModel.findAll({
                where: {
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchQuery}%` } },
                        { description: { [Op.like]: `%${searchQuery}%` } }
                    ]
                },
                ...courseIncludeObj
            }),
            productModel.findAll({
                where: {
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchQuery}%` } },
                        { description: { [Op.like]: `%${searchQuery}%` } }
                    ]
                },
                ...productIncludeObj
            }),
            serviceModel.findAll({
                where: {
                    [Op.or]: [
                        { title: { [Op.like]: `%${searchQuery}%` } },
                        { description: { [Op.like]: `%${searchQuery}%` } }
                    ]
                },
                ...serviceIncludeObj
            })
        ]);

        const modifiedPosts = posts.map(post => ({
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

        // Combine results
        const results = {
            users,
            posts: modifiedPosts,
            courses,
            products,
            services
        };

        res.status(200).send(responseObject("Data Received Successfully", 200, results));
    } catch (error) {
        console.log(error, "error in it")
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
})

globalSearchRouter.post('/getHistory', async (req, res) => {
    try {
        const { context } = req.body;
        let userSearches = await userSearchesModel.findAll({
            attributes: ['id', 'keyWords'],
            where: {
                userEmail: req.userEmail,
                context: context
            },
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        userSearches = userSearches.map(x => x.dataValues);
        res.status(200).send(responseObject("Data Received Successfully", 200, userSearches));
    } catch (error) {
        console.log(error, "error in it")
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
})

module.exports = globalSearchRouter