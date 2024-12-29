const Joi = require('joi');
const { objectId } = require('./custom.validation');

const fetchSkills = {
    query: Joi.object().keys({
            s: Joi.string().min(2).required(),
            e: Joi.array().items(Joi.string().custom(objectId))
        }
    ),
};

module.exports = {
    fetchSkills, 
};
