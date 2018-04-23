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
const logger = require('../config/logger');

/**
 * Validate parameters.
 */
const validate = (schema) => {
  return (req, res, next) => {
    Joi.validate(req.body, schema, (err, value) => {
      if (err) {
        const errorType = 'ParameterValidationError';
        const errorMessage = 'Could not validate request data.\n' + err.stack;
        logger.warn('[%s] %s', errorType, errorMessage);
        return res.status(500).json({
          error: errorType,
          message: errorMessage,
        });
      } else {
        req.originalBody = req.body;
        req.body = value;
        next();
      }
    });
  };
};

const jobQuery = (req, res, next) => {
  const query = {};
  if (req.query.username) {
    query.username = req.query.username;
  }
  req._query = query;
  next();
};

// module exports
module.exports = {validate, jobQuery};
