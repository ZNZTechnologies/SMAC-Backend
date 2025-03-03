const Joi = require("joi");

const updateRefundSchema = Joi.object({
    status: Joi.string().valid("Closed").required()
});

const validateUpdateRefund = (body) => {
    return updateRefundSchema.validate(body);
}

const createRefund = Joi.object({
    reasonForRefund: Joi.string().max(500).required()
})

const validateCreateRefund = (body) => {
    return createRefund.validate(body)
}

module.exports = { validateUpdateRefund, validateCreateRefund }