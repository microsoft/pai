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

const userModel = require('./user');
const util = require('util');
const createError = require('../util/error');

const check = (username, password, callback) => {
  const dbGet = util.callbackify(userModel.db.get.bind(userModel.db));
  dbGet(username, null, (err, res) => {
    if (!res) {
      return callback(createError('Bad Request', 'NoUserError', `User ${username} is not found.`));
    }
    userModel.encrypt(username, password, (err, derivedKey) => {
      if (err) {
        return callback(err);
      }
      callback(null,
        derivedKey === res[0]['password'],
        res[0]['admin'] === 'true',
        res[0].hasOwnProperty('githubPAT')&&
        Boolean(res[0]['githubPAT']));
    });
  });
};

module.exports = {check};
