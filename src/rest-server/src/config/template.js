// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


const Joi = require('joi');

const templateTypes = ['data', 'dockerimage', 'job', 'script'];

const templateInputSchema = Joi.object().keys({
  protocol_version: Joi.string()
    .allow('')
    .default('v2'),
  name: Joi.string()
    .required(),
  type: Joi.string()
    .valid(templateTypes),
  contributor: Joi.string()
    .required(),
  description: Joi.string()
    .allow('')
    .default(''),
  version: Joi.when('type', {
      is: 'job',
      then: Joi.string(),
      otherwise: Joi.string().required(),
    }),
  uri: Joi.when('type', {
      is: 'job',
      then: Joi.forbidden(),
      otherwise: Joi.string().required(),
    }),
  usage: Joi.when('type', {
    is: 'script',
    then: Joi.object(),
    otherwise: Joi.forbidden(),
  }),
  prerequisites: Joi.when('type', {
    is: 'job',
    then: Joi.array().required(),
    otherwise: Joi.forbidden(),
  }),
  tasks: Joi.when('type', {
    is: 'job',
    then: Joi.array().required(),
    otherwise: Joi.forbidden(),
  }),
  parameters: Joi
    .when('type', {
      is: 'data',
      then: Joi.forbidden(),
    })
    .when('type', {
      is: 'dockerimage',
      then: Joi.forbidden(),
    })
    .when('type', {
      is: 'job',
      then: Joi.array(),
    })
    .when('type', {
      is: 'script',
      then: Joi.array(),
    }),
  retryCount: Joi.when('type', {
    is: 'job',
    then: Joi.number().integer(),
    otherwise: Joi.forbidden(),
  }),
}).required();

module.exports = {
  schema: templateInputSchema,
  types: templateTypes,
};
