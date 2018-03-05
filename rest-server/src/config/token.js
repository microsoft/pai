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

// module dependencies
const Joi = require('joi');
const jwt = require('express-jwt');
const config = require('./index');

const jwtCheck = jwt({
  secret: config.jwtSecret,
});

// define input schema
const tokenPostInputSchema = Joi.object().keys({
  username: Joi.string()
    .token()
    .required(),
  password: Joi.string()
    .min(6)
    .required(),
  expiration: Joi.number()
    .integer()
    .min(60)
    .max(7 * 24 * 60 * 60)
    .default(24 * 60 * 60),
}).required();

// module exports
module.exports = {
  secret: config.jwtSecret,
  check: jwtCheck,
  tokenPostInputSchema: tokenPostInputSchema,
};
