
const Joi = require('joi')


const Benefit = Joi.object({
    title: Joi.string().max(255).required(),
    subscriptionId: Joi.max(255).required()
})

const validateBenefit = (data) => {
    return Benefit.validate(data)
}


module.exports = { validateBenefit }
