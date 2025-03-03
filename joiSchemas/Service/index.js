const Joi = require('joi')

const createServiceSchema = Joi.object({
    parentCategory: Joi.string().required(),
    subCategories: Joi.array().items(Joi.string()).required(),
    title: Joi.string().max(255).required(),
    serviceFee: Joi.number().integer().min(1).max(2147483000).required(),
    description: Joi.string().max(1000).required(),
})

const validateCreateService = (body) => {
    return createServiceSchema.validate(body)
}

const updateServiceSchema = Joi.object({
    parentCategory: Joi.string().max(255),
    subCategories: Joi.array().items(Joi.string()).when('parentCategory', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    title: Joi.string().max(255),
    serviceFee: Joi.number().integer().min(1).max(2147483000),
    description: Joi.string().max(1000),
    deletedImages: Joi.array()
})

const validateUpdateService = (body) => {
    return updateServiceSchema.validate(body)
}

module.exports = { validateCreateService, validateUpdateService }