'use strict';
const Joi = require('joi');
const createError = require('@pai/utils/error');

const validate = (schema) => {
    return (req, res, next) => {
        Joi.validate(req.body, schema, {allowUnknown: true}, (err, value) => {
            if (err) {
                next(createError('Bad Request', 'InvalidParametersError', err.message));
            } else {
                req.originalBody = req.body;
                req.body = value;
                next();
            }
        });
    };
};

const jobSubmissionSchema = Joi.object().keys({
    moduleId: Joi.string().required(),
    frameworkName: Joi.string(),
    parameters: Joi.object().keys({ // Only parameters with known default values are provided
        PassUserNameInfoContainer: Joi.bool().default(true),
        JobDriverVCores: Joi.number().integer().positive().default(1),
        JobDriverMemGB: Joi.number().positive().default(4),
        JobNodeLabel: Joi.string().default('*persistent*|*besteffort*'),
        JobQueue: Joi.string().default('default'),
    }),
});

const exampleDataSchema = Joi.object().keys({
    info: Joi.object({
        moduleId: Joi.string().required(),
        name: Joi.string().required(),
        category: Joi.string().required(),
        owner: Joi.string(),
        description: Joi.string().required(),
    }).required(),
    parameters: Joi.object().required(),
});

module.exports = {
    validate,
    jobSubmissionSchema,
    exampleDataSchema,
};
