const Joi = require("joi")

const createOrderSchema = Joi.object({
    courseId: Joi.string().required().max(255),
})

const validateCreateOrder = (body) => {
    return createOrderSchema.validate(body);
}

module.exports = { validateCreateOrder }
