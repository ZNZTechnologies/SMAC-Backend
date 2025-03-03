const Joi = require("joi")

const updateARefund = Joi.object({
    status: Joi.string().valid('Approved', 'Rejected', 'Closed').required(),
    reasonForRejected: Joi.when('status', {
        is: 'Rejected',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    })
});

const validateUpdateRefund = (body) => {
    return updateARefund.validate(body)
}

module.exports = {
    validateUpdateRefund
}