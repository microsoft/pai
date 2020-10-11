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

// define the input schema for the 'post request' api
const requestPostInputSchema = Joi.object()
  .keys({
    type: Joi.string().valid(Object.values(requestType)).required(),
    vc: Joi.array().items(Joi.string()),
    user: Joi.object().keys({
      username: Joi.string()
        .regex(/^[\w.-]+$/, 'username')
        .required(),
      email: Joi.string().email(),
      password: Joi.string().min(6),
    }),
    storage: Joi.array().items(Joi.string()),
    message: Joi.string().max(1024).empty(''),
  })
  .required()
  .when('type', {
    is: requestType.VC,
    then: Joi.object({ vc: Joi.required() }),
  })
  .when('type', {
    is: requestType.USER,
    then: Joi.object({ user: Joi.required() }),
  })
  .when('type', {
    is: requestType.STORAGE,
    then: Joi.object({ storage: Joi.required() }),
  });

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
