const { responseObject } = require("../../../../utils/responseObject")
const courseRefundModel = require("../../../../models/courseRefundModel");
const { validateUpdateRefund } = require("../../../../joiSchemas/Admin/course/refund");
const userModel = require("../../../../models/userModel");
const courseModel = require("../../../../models/courseModel");
const courseOrder = require("../../../../models/courseOrder");
// const courseRefundModel = require("../../../../models/courseRefundModel")


const includeAttribute = {
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
        const refunds = await courseRefundModel.findAll({
            ...includeAttribute
        });

        return res.status(200).send(responseObject("All Received", 200, refunds))
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
};


const updateARefund = async (req, res) => {
    try {
        const { error, value } = validateUpdateRefund(req.body)
        if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message));

        const refundId = req.params.refundId;

        const refund = await courseRefundModel.findOne({
            where: {
                refundId,
            },
            ...includeAttribute
        });

        if (!refund) return res.status(404).send(responseObject("Not Found", 404, "", "Refund Id Is Not Valid"));

        if (refund.status !== "Pending") return res.status(400).send(responseObject("Can't Update Status Once Changed From Pending", 400, "", "Can't Update Status Once Changed From Pending"))

        if (refund.status === "Closed") return res.status(400).send(responseObject("Can't Update Once It Is Closed", 400, "", "Status Can't Change Once Closed"))

        await refund.update({
            ...value
        })

        return res.status(200).send(responseObject("Ticket Update Succesfully", 200, refund))
    } catch (error) {
        console.log(error)
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}

const getARefund = async (req, res) => {
    try {
        const refundId = req.params.refundId;

        const refund = await courseRefundModel.findByPk(refundId, {
            ...includeAttribute
        });

        if (!refund) return res.status(404).send(responseObject("Id is not valid", 404, "", "Refund Id is not valid"))

        return res.status(200).send(responseObject("Successfully Reterieved", 200, refund));
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }
}


module.exports = {
    getAllRefunds,
    updateARefund,
    getARefund
}