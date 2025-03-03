
const Joi = require('joi')


const Subscription = Joi.object({
    name: Joi.string().max(255).required(),
    benefits: Joi.array().empty(Joi.array().length(0)),
    plans: Joi.array().empty(Joi.array().length(0)),
    icon: Joi.any()
})

const validateSubscription = (data) => {
    return Subscription.validate(data)
}


module.exports = { validateSubscription }
