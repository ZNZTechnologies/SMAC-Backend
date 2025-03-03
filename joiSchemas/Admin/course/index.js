const Joi = require('joi')


const courseParentCat = Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().max(1000).required()
})

const validateCreateParentCat = (data) => {
    return courseParentCat.validate(data)
}

const courseSubCat = Joi.object({
    name: Joi.string().max(255).required(),
    parentCategoryId: Joi.string().max(255).required()
})

const validateCreateSubCat = (data) => {
    return courseSubCat.validate(data)
}


module.exports = { validateCreateParentCat, validateCreateSubCat }