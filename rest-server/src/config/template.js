
const Joi = require('joi');

const recommendCountSchema = Joi.object().keys({
  'count': Joi.number()
    .integer()
    .min(0),
});


// module exports
module.exports = {
  recommendCountSchema: recommendCountSchema,
};
