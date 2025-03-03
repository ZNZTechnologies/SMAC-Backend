const { responseObject } = require("../../utils/responseObject")
const serviceRefundModel = require("../../models/serviceRefundModel");
const serviceModel = require("../../models/serviceModel");
const serviceOrder = require("../../models/serviceOrder");
const userModel = require("../../models/userModel");
const courseRefundModel = require("../../models/courseRefundModel");
const courseModel = require("../../models/courseModel");
const courseOrder = require("../../models/courseOrder");



const includeAttributesForServices = {
    include: [
        { model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] },
        { model: serviceModel, include: [{ model: userModel, attributes: ["firstName", "lastName", "email", "profilePic"] }] },
        { model: serviceOrder, as: "order" }
    ],
    attributes: {
        exclude: ["orderId", "serviceId"]
    }
}

const includeAttributesForCourses = {
    include: [
        { model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] },
        { model: courseModel, include: [{ model: userModel, attributes: ["firstName", "lastName", "email", "profilePic"] }] },
        { model: courseOrder, as: "order" }
    ],
    attributes: {
        exclude: ["orderId", "courseId"]
    }
}

const getAllRefunds = async (req, res) => {
    try {
        let serviceRefunds = await serviceRefundModel.findAll({
            ...includeAttributesForServices
        });

        let courseRefunds = await courseRefundModel.findAll({
            ...includeAttributesForCourses
        });

        const refunds = [...serviceRefunds, ...courseRefunds]

        return res.status(200).send(responseObject("All Refunds", 200, refunds))
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
};


const getUserRefunds = async (req, res) => {
    try {
        const userEmail = req.userEmail;

        let serviceRefunds = await serviceRefundModel.findAll({
            ...includeAttributesForServices,
            where: {
                requestingUser: userEmail
            }
        });

        let courseRefunds = await courseRefundModel.findAll({
            ...includeAttributesForCourses,
            where: {
                requestingUser: userEmail
            }
        });

        const refunds = [...serviceRefunds, ...courseRefunds]

        return res.status(200).send(responseObject("User Refunds", 200, refunds))
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}


const getSellerUserRefunds = async (req, res) => {
    try {
        const userEmail = req.userEmail;
        const user = await userModel.findByPk(userEmail);

        let serviceRefunds = await serviceRefundModel.findAll({
            attributes: {
                exclude: ["orderId", "serviceId"]
            },
            include: [
                { model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] },
                { model: serviceModel,
                  where: {
                    authorId: user.dataValues.id
                  },
                  include: [{ model: userModel, attributes: ["firstName", "lastName", "email", "profilePic"] }]
                },
                { model: serviceOrder, as: "order" }
            ]
        });

        let courseRefunds = await courseRefundModel.findAll({
            attributes: {
                exclude: ["orderId", "courseId"]
            },
            include: [
                { model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] },
                { model: courseModel,
                  where: {
                    authorEmail: userEmail
                  },
                  include: [{ model: userModel, attributes: ["firstName", "lastName", "email", "profilePic"] }]
                },
                { model: courseOrder, as: "order" }
            ]
        });

        const refunds = [...serviceRefunds, ...courseRefunds]

        return res.status(200).send(responseObject("User Refunds", 200, refunds))
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}


module.exports = {
    getAllRefunds,
    getUserRefunds,
    getSellerUserRefunds
}