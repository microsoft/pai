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
const param = require('./parameter');
const jobConfig = require('../config/job');
const createError = require('../util/error');


const checkKillAllOnCompletedTaskNumber = (req, res, next) => {
  let tasksNumber = 0;
  for (let i = 0; i < req.body.taskRoles.length; i ++) {
    tasksNumber += req.body.taskRoles[i].taskNumber;
  }
  const killAllOnCompletedTaskNumber = req.body.killAllOnCompletedTaskNumber;
  if (killAllOnCompletedTaskNumber > tasksNumber) {
    const errorMessage = 'killAllOnCompletedTaskNumber should not be greater than tasks number.';
    next(createError('Bad Request', 'ERR_INVALID_PARAMETERS', errorMessage));
  } else {
    next();
  }
};

const submission = [
  param.validate(jobConfig.schema),
  checkKillAllOnCompletedTaskNumber,
];

const query = (req, res, next) => {
  const query = {};
  if (req.query.username) {
    query.username = req.query.username;
  }
  req._query = query;
  next();
};

// module exports
module.exports = {submission, query};
