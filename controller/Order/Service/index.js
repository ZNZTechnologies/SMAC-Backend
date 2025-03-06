
const { validateCreateOrder } = require("../../../joiSchemas/Order/Service");
const serviceModel = require("../../../models/serviceModel");
const serviceOrder = require("../../../models/serviceOrder");
const paymentModel = require("../../../models/paymentModel");
const userModel = require("../../../models/userModel");
const { makeWalletPayment, parseResponse } = require("../../../utils/jazzcash");
const { responseObject } = require("../../../utils/responseObject");
const { where } = require("sequelize");
const sequelize = require("../../../database/connection");

const includeAttributeObject = {
    include: [
        { model: userModel, attributes: ["email", "firstName", "lastName", "profilePic"] },
        { model: serviceModel }
    ]
}

const createOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userEmail = req.userEmail;
        const serviceId = req.params.serviceId;

        let u = await userModel.findByPk(userEmail);
        u = u.dataValues;

        if(u.role == 'admin' || u.role == 'refundSupervisor') {
            return res.status(400).send(responseObject("Admins Can't buy services", 400, "", "Invalid Request"))
        }

        const service = await serviceModel.findByPk(serviceId, {
            include: {
                model: userModel,
                attributes: ['email']
            }
        });
        if (!service) return res.status(404).send(responseObject("Service Not Found", 404, "", "Id is not valid"))

        if (userEmail == service.dataValues.user.dataValues.email) return res.status(400).send(responseObject("Can't buy own service", 400, "", "Invalid Request"))

        const chkOrder = await serviceOrder.findOne({
            where: {
                userEmail,
                serviceId
            }
        })
        
        if (chkOrder) return res.status(400).send(responseObject("Already Order Created", 400, "", "Can't Order More Then Once"))

        const order = await serviceOrder.create({
            userEmail,
            serviceId
        }, { transaction: t })

        // try payments here.............

        req.body.Amount = service.serviceFee;

        let payment = await makeWalletPayment(req.body);

        let paymentReponseObject = {
            userEmail: userEmail,
            orderAmount: service.serviceFee,
            type: 'servicePayment',
            description: req.body.Description
        };

        let pr;
        if(payment.status == 200) {
            pr = await parseResponse(payment.body);
            if(pr.pp_ResponseCode == '000') {
              paymentReponseObject.status = 'success';
              paymentReponseObject.statusMessage = pr.pp_ResponseMessage;
              paymentReponseObject.response = pr;
              paymentReponseObject.taxAmount = service.serviceFee - parseFloat(pr.pp_Amount);
              paymentReponseObject.amountReceived = service.serviceFee - paymentReponseObject.taxAmount;
              paymentReponseObject.platformFee = 5 * service.serviceFee / 100;
            } else if(pr.pp_ResponseCode == '999') { // TBD bcz it's also being used for failed ones from jazzcash
                paymentReponseObject.status = 'pending';
                paymentReponseObject.statusMessage = 'thank you for using jazzcash, your payment has been made and will be transfered shortly, plz do not make another transaction';
                paymentReponseObject.response = pr;
                paymentReponseObject.taxAmount = service.serviceFee - parseFloat(pr.pp_Amount);
                paymentReponseObject.amountReceived = service.serviceFee - paymentReponseObject.taxAmount;
                paymentReponseObject.platformFee = 5 * service.serviceFee / 100;
            } else {
              paymentReponseObject.status = 'failed';
              paymentReponseObject.statusMessage = pr.pp_ResponseCode == '199' ? 'Authentication Failed' : pr.pp_ResponseMessage;
            }
        } else {
            paymentReponseObject.status = 'failed';
            paymentReponseObject.statusMessage = 'Network Error';
       }
       paymentReponseObject.txnReference = pr.pp_TxnRefNo;

        let p = await paymentModel.create(paymentReponseObject, { transaction: t });

        // response part

        if(p.dataValues.status == 'failed') {
            await t.rollback();
            return res.status(400).send(responseObject(paymentReponseObject.statusMessage, 400, "", "Cannot create Order because of failed payment"))
        } else {
            await order.update({ paymentId: p.dataValues.paymentId }, { transaction: t });
            await t.commit();

            let data = await serviceOrder.findByPk(order.orderId, {
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
        const order = await serviceOrder.findOne({
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

        const orders = await serviceOrder.findAll({
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


const getAllOrdersForASpecificService = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        const authorId = req.userId;

        const service = await serviceModel.findOne({
            where: {
                serviceId,
                authorId: authorId
            }
        });

        if (!service)
            return res.status(400).send(responseObject("No Service Found", 400, "", "Service Id is not valid or you are not authorize to see orders"))
        
        const orders = await serviceOrder.findAll({
            where: {
                serviceId,
            },
            ...includeAttributeObject
        })

        return res.status(200).send(responseObject("Orders Reterived Successfully", 200, orders))

    } catch (error) {
        return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
    }
}

module.exports = { createOrder, getASingleOrder, getAllOrders, getAllOrdersForASpecificService }