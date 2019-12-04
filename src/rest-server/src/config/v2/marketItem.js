const Joi = require('joi');

const marketItemCreateInputSchema = Joi.object().keys({
	id: Joi.string()
		.uuid()
		.required(),
	name: Joi.string()
		.required(),
	author: Joi.string()
		.required(),
	createDate: Joi.string()
		.required(),
	updateDate: Joi.string()
		.required(),
	category: Joi.string()
		.required(),
	tags: Joi.array()
		.items(Joi.string())
		.default([]),
	introduction: Joi.string()
		.default(''),
	description: Joi.string()
		.default(''),
	jobConfig: Joi.string()
		.required(),
	submits: Joi.number()
		.default(0),
	stars: Joi.number()
		.default(0),
});

const marketItemUpdateInputSchema = Joi.object().keys({
  name: Joi.string()
    .required(),
  updateDate: Joi.string()
    .required(),
  category: Joi.string()
    .required(),
  tags: Joi.array()
    .items(Joi.string())
    .default([]),
  introduction: Joi.string()
    .default(''),
  description: Joi.string()
    .default(''),
});

module.exports = {
	marketItemCreateInputSchema,
	marketItemUpdateInputSchema,
};