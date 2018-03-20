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
const path = require('path');
const fse = require('fs-extra');
const crypto = require('crypto');
const config = require('../config/index');
const dbUtility = require('../util/dbUtility');
const etcdConfig = require('../config/etcd');
const logger = require('../config/logger')

const encrypt = (username, password, callback) => {
  const iterations = 10000;
  const keylen = 64;
  const salt = crypto.createHash('md5').update(username).digest('hex');
  if (callback) {
    crypto.pbkdf2(password, salt, iterations, keylen, 'sha512', (err, derivedKey) => {
      callback(err, derivedKey.toString('hex'));
    });
  } else {
    return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha512').toString('hex');
  }
};

const db = dbUtility.getStorageObject("etcd2", {
  'hosts': etcdConfig.etcdHosts
})

const update = (username, password, admin, modify, callback) => {
  if (typeof modify === 'undefined') {
    callback(null, false);
  } else {
    db.has(etcdConfig.userPath(username), (error, res) => {
      logger.info(res);
      if (res !== modify) {
        callback(null, false);
      } else {
        encrypt(username, password, (err, derivedKey) => {
          logger.info("encrypt" + err);
          if (err) {
            callback(err, false);
          } else {
            if (modify) {
              db.set(etcdConfig.userPasswdPath(username), derivedKey, (err, res) => {
                logger.info("update user password: " + err);
                logger.info("update user password: " + res);
                if (err !== null) {
                  logger.info(err);
                  callback(err, false);
                }
              }, { prevExist: true })
            } else {
              db.set(etcdConfig.userPath(username), null, (err, res) => {
                logger.info("set user path: " + err);
                logger.info("set user path: " + res);
                if (err !== null) {
                  logger.info(err);
                  callback(err, false);
                }
                db.set(etcdConfig.userPasswdPath(username), derivedKey, (err, result) => {
                  logger.info("set user password path: " + err);
                  logger.info("set user password path: " + res);
                  if (err !== null) {
                    logger.info(error);
                    callback(error, false);
                  }
                })
              }, { dir: true })
            }
            if (typeof admin !== 'undefined') {
              db.set(etcdConfig.userAdminPath(username), admin, (err, res) => {
                logger.info("set user admin path: " + err);
                logger.info("set user admin path: " + res);
                if (err !== null) {
                  logger.info(err);
                  callback(err, false);
                }
              })
            }
            callback(null, true);
          }
        });
      }
    });
  }
};

const remove = (username, callback) => {
  logger.info('username is' + username);
  if (typeof username === 'undefined') {
    callback(new Error('user does not exist'), false);
  } else {
    db.has(etcdConfig.userPath(username), (error, res) => {
      logger.info('remove db.has' + res)
      if (!res) {
        callback(new Error('user does not exist'), false);
      } else {
        db.get(etcdConfig.userAdminPath(username), (err, res) => {
          if (err !== null) {
            callback(err, false);
          } else {
            if (res.value === 'true') {
              callback(new Error('can not delete admin user'), false);
            } else {
              db.delete(etcdConfig.userPath(username), (error, result) => {
                if (error !== null) {
                  callback(new Error('delete user failed'), false);
                }
                callback(null, true);
              }, { recursive: true });
            }
          }
        })
      }
    })
  }
};

const setDefaultAdmin = () => {
  logger.info("create default admin");
  update(etcdConfig.adminName, etcdConfig.adminPass, true, false, (res, status) => {
    if (status) {
      logger.info('create default admin successfully');
    } else {
      throw new Error('unable to set default admin');
    }
  })
};

const prepareStoragePath = () => {
  logger.info("prepare storage path:");
  db.set(etcdConfig.storagePath(), null, (err, res) => {
    if (!err) {
      throw new Error('build storage path failed');
    } else {
      setDefaultAdmin();
    }
  }, { dir: true })
}

if (config.env !== 'test') {
  db.has(etcdConfig.storagePath(), (err, res) => {
    logger.info("db.has callback " + res);
    logger.info(etcdConfig.storagePath());
    if (res) {
      logger.info("storage path already exists");
    } else {
      logger.info("storage path not exist");
      prepareStoragePath();
    }
  })
}

// module exports
module.exports = { encrypt, db, update, remove };
