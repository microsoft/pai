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
const logger = require('../config/logger')

const check = (username, password, callback) => {
  // let user = userModel.db.getSync(etcdConfig.userPath(username));
  // if (user.errCode !== "0") {
  //   callback(null, false, false);
  // } else {
  //   userModel.encrypt(username, password, (err, derivedKey) => {
  //     callback(err, derivedKey === userModel.db.getSync(etcdConfig.userPasswdPath(username)).value, userModel.db.getSync(etcdConfig.userAdminPath(username)).value);
  //   });
  // }
  userModel.db.has(etcdConfig.userPath(username), (res, error) => {
    logger.info("userModel.db.has" + res);
    if (!res) {
      callback(null, false, false);
    } else {
      let pass = '';
      let isAdmin = '';
      userModel.db.get(etcdConfig.userPasswdPath(username), (res) => {
        if (res.errCode !== userModel.db.getErrorCode().SUCCESS) {
          callback(res.errMsg, false, false);
        }
        pass = res.value;
        userModel.db.get(etcdConfig.userAdminPath(username), (res) => {
          if (res.errCode !== '0') {
            callback(res.errMsg, false, false);
          }
          isAdmin = res.value;
          logger.info("db pass is" + pass);
          logger.info('isAdmin ' + isAdmin);
          userModel.encrypt(username, password, (err, derivedKey) => {
            logger.info('derivedkey is ' + derivedKey);
            callback(err, derivedKey === pass, isAdmin);
          })
        })
      })
    }
  })
};

module.exports = { check };
