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
const rateLimit = require('express-rate-limit');

let limiterConfig = {
  apiPerMin: process.env.RATE_LIMIT_API_PER_MIN,
  listJobPerMin: process.env.RATE_LIMIT_LIST_JOB_PER_MIN,
  submitJobPerHour: process.env.RATE_LIMIT_SUBMIT_JOB_PER_HOUR,
};

const limiterConfigSchema = Joi.object()
  .keys({
    apiPerMin: Joi.number().integer().default(600),
    listJobPerMin: Joi.number().integer().default(60),
    submitJobPerHour: Joi.number().integer().default(60),
  })
  .required();

const { error, value } = Joi.validate(limiterConfig, limiterConfigSchema);
if (error) {
  throw new Error(`rate limit config error\n${error}`);
}
limiterConfig = value;

// module exports
module.exports = {
  api: rateLimit({
    max: limiterConfig.apiPerMin,
    windowMs: 1 * 60 * 1000,
  }),
  listJob: rateLimit({
    max: limiterConfig.listJobPerMin,
    windowMs: 1 * 60 * 1000,
    keyGenerator: (req) => req.user.username,
  }),
  submitJob: rateLimit({
    max: limiterConfig.submitJobPerHour,
    windowMs: 1 * 60 * 60 * 1000,
    keyGenerator: (req) => req.user.username,
  }),
};
