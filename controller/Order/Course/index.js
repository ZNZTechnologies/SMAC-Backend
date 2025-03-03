const sequelize = require("../../../database/connection");
const { validateCreateOrder } = require("../../../joiSchemas/Order/Course");
const courseModel = require("../../../models/courseModel");
const courseOrder = require("../../../models/courseOrder");
const paymentModel = require("../../../models/paymentModel");
const userModel = require("../../../models/userModel");
const { makeWalletPayment, parseResponse } = require("../../../utils/jazzcash");
const { responseObject } = require("../../../utils/responseObject")


const includeAttributeObject = {
    include: [
        { model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] },
        { model: courseModel }
    ]
}

const createOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userEmail = req.userEmail;
        const courseId = req.params.courseId;

        let u = await userModel.findByPk(userEmail);
        u = u.dataValues;

        if(u.role == 'admin' || u.role == 'refundSupervisor') {
            return res.status(400).send(responseObject("Admins Can't buy course", 400, "", "Invalid Request"))
        }

        const course = await courseModel.findByPk(courseId, {
            include: {
                model: userModel,
                attributes: ['email']
            }
        });
        if (!course) return res.status(404).send(responseObject("Course Not Found", 404, "", "Id is not valid"))

        if (userEmail == course.dataValues.user.dataValues.email) return res.status(400).send(responseObject("Can't buy own course", 400, "", "Invalid Request"))

        const chkOrder = await courseOrder.findOne({
            where: {
                userEmail,
                courseId
            }
        })
        
        if (chkOrder) return res.status(400).send(responseObject("Already Order Created", 400, "", "Can't Order More Then Once"))

        const order = await courseOrder.create({
            userEmail,
            courseId
        }, { transaction: t })

        // try payments here.............

        req.body.Amount = course.courseFee;

        let payment = await makeWalletPayment(req.body);

        let paymentReponseObject = {
            userEmail: userEmail,
            orderAmount: course.courseFee,
            type: 'coursePayment',
            description: req.body.Description
        };

        let pr;
        if(payment.status == 200) {
            pr = await parseResponse(payment.body);
            if(pr.pp_ResponseCode == '000') {
              paymentReponseObject.status = 'success';
              paymentReponseObject.statusMessage = pr.pp_ResponseMessage;
              paymentReponseObject.response = pr;
              paymentReponseObject.taxAmount = course.courseFee - parseFloat(pr.pp_Amount);
              paymentReponseObject.amountReceived = course.courseFee - paymentReponseObject.taxAmount;
              paymentReponseObject.platformFee = 5 * course.courseFee / 100;
            } else if(pr.pp_ResponseCode == '999') {
                paymentReponseObject.status = 'pending';
                paymentReponseObject.statusMessage = 'thank you for using jazzcash, your payment has been made and will be transfered shortly, plz do not make another transaction';
            } else {
              paymentReponseObject.status = 'failed';
              paymentReponseObject.statusMessage = pr.pp_ResponseCode == '199' ? 'Authentication Failed' : pr.pp_ResponseMessage;
            }
        } else {
            paymentReponseObject.status = 'failed';
            paymentReponseObject.statusMessage = 'Network Error';
       }

        let p = await paymentModel.create(paymentReponseObject, { transaction: t });

        // response part

        if(p.dataValues.status == 'failed') {
            await t.rollback();
            return res.status(400).send(responseObject(paymentReponseObject.statusMessage, 400, "", "Cannot create Order because of failed payment"))
        } else {
            await t.commit();
            await courseOrder.update({ paymentId: p.dataValues.paymentId }, {
                where: {
                    orderId: order.orderId
                }
            });

            let data = await courseOrder.findByPk(order.orderId, {
                ...includeAttributeObject
            });

            data.dataValues.payment = {
                status: p.dataValues.status,
                message: paymentReponseObject.statusMessage
            };

            return res.status(201).send(responseObject("Order Created", 201, data))
        }
    } catch (error) {
        await t.rollback();
        console.log(error)
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }

}

const getASingleOrder = async (req, res) => {
    try {
        const id = req.params.orderId
        const order = await courseOrder.findOne({
            where: {
                orderId: id,
                userEmail: req.userEmail
            },
            ...includeAttributeObject
        })

        return res.status(200).send(responseObject("Order Received Successfully", 200, order))
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }

}

const getAllOrders = async (req, res) => {
    try {
        const userEmail = req.userEmail;

        const orders = await courseOrder.findAll({
            where: {
                userEmail
            },
            ...includeAttributeObject
        })

        return res.status(200).send(responseObject("All Orders", 200, orders));
    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
    }

}


const getAllOrdersForASpecificCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userEmail = req.userEmail;

        const course = await courseModel.findOne({
            where: {
                courseId,
                authorEmail: userEmail
            }
        });

        if (!course)
            return res.status(400).send(responseObject("No Course Found", 400, "", "Course Id is not valid or you are not authorize to see orders"))

        const orders = await courseOrder.findAll({
            where: {
                courseId,
            },
            ...includeAttributeObject
        })

        return res.status(200).send(responseObject("Orders Reterived Successfully", 200, orders))

    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
    }
}

module.exports = { createOrder, getASingleOrder, getAllOrders, getAllOrdersForASpecificCourse }