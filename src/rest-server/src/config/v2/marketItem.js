const Joi = require('joi');

const marketItemCreateInputSchema = Joi.object().keys({
	name: Joi.string()
		.required(),
	author: Joi.string()
		.required(),
	category: Joi.string()
		.required(),
	introduction: Joi.string()
		.default(''),
	description: Joi.string()
		.default(''),
	jobConfig: Joi.string()
		.required(),
	submits: Joi.number()
		.default(0),
	starNumber: Joi.number()
		.default(0),
	tags: Joi.array()
		.items(Joi.string())
		.default([]),
});

const marketItemUpdateInputSchema = Joi.object().keys({
	name: Joi.string()
		.required(),
	author: Joi.string()
		.required(),
	category: Joi.string()
		.required(),
	introduction: Joi.string()
		.default(''),
	description: Joi.string()
		.default(''),
	jobConfig: Joi.string()
		.required(),
	submits: Joi.number()
		.default(0),
	starNumber: Joi.number()
		.default(0),
	tags: Joi.array()
		.items(Joi.string())
		.default([]),
});

module.exports = {
	marketItemCreateInputSchema,
	marketItemUpdateInputSchema,
};