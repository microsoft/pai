// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const Joi = require('joi');

const requestType = {
  VC: 'vc',
  USER: 'user',
  STORAGE: 'storage',
};

const requestState = {
  NEW: 'new',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// define the input schema for the 'post request vc' api
const requestPostInputSchema = Joi.alternatives()
  .try(
    Joi.object().keys({
      type: Joi.string().valid(requestType.VC).required(),
      vc: Joi.array().items(Joi.string()).required(),
      message: Joi.string().max(1024).empty(''),
    }),
    Joi.object().keys({
      type: Joi.string().valid(requestType.USER).required(),
      user: Joi.object().keys({
        username: Joi.string()
          .regex(/^[\w.-]+$/, 'username')
          .required(),
        email: Joi.string().email(),
        password: Joi.string().min(6),
      }),
      message: Joi.string().max(1024).empty(''),
    }),
    Joi.object().keys({
      type: Joi.string().valid(requestType.STORAGE).required(),
      storage: Joi.array().items(Joi.string()).required(),
      message: Joi.string().max(1024).empty(''),
    }),
  )
  .require();

// define the input schema for the 'put request' api
const requestPutInputSchema = Joi.object()
  .keys({
    state: Joi.string().valid(Object.values(requestState)).required(),
  })
  .required();

// module exports
module.exports = {
  requestType,
  requestState,
  requestPostInputSchema,
  requestPutInputSchema,
};
