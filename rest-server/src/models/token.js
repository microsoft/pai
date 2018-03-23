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
const etcdConfig = require('../config/etcd');

const check = (username, password, callback) => {
  userModel.db.has(etcdConfig.userPath(username), null, (errMsg, res) => {
    if (!res) {
      callback(null, false, false);
    } else {
      userModel.db.get(etcdConfig.userPath(username), {recursive: true}, (errMsg, res) => {
        if (errMsg) {
          callback(errMsg, false, false);
        } else {
          userModel.encrypt(username, password, (errMsg, derivedKey) => {
            callback(errMsg, derivedKey === res.get(etcdConfig.userPasswdPath(username)), res.get(etcdConfig.userAdminPath(username)) === 'true');
          });
        }
      });
    }
  });
};

module.exports = {check};
