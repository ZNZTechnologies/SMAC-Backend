const Joi = require("joi")

const createOrderSchema = Joi.object({
    serviceId: Joi.string().required().max(255),
})

const validateCreateOrder = (body) => {
    return createOrderSchema.validate(body);
}

module.exports = { validateCreateOrder }
