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
const crypto = require('crypto');
const config = require('../config/index');
const dbUtility = require('../util/dbUtil');
const etcdConfig = require('../config/etcd');
const logger = require('../config/logger');

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

const db = dbUtility.getStorageObject('etcd2', {
  'hosts': etcdConfig.etcdHosts,
});

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
          if (err) {
            callback(err, false);
          } else {
            if (modify) {
              db.set(etcdConfig.userPasswdPath(username), derivedKey, (err, res) => {
                if (err !== null) {
                  logger.info(err);
                  callback(err, false);
                }
              }, {prevExist: true});
            } else {
              db.set(etcdConfig.userPath(username), null, (err, res) => {
                if (err !== null) {
                  logger.info(err);
                  callback(err, false);
                }
                db.set(etcdConfig.userPasswdPath(username), derivedKey, (err, result) => {
                  if (err !== null) {
                    logger.info(error);
                    callback(error, false);
                  }
                });
              }, {dir: true});
            }
            if (typeof admin !== 'undefined') {
              db.set(etcdConfig.userAdminPath(username), admin, (err, res) => {
                if (err !== null) {
                  logger.info(err);
                  callback(err, false);
                }
              });
            }
            callback(null, true);
          }
        });
      }
    });
  }
};

const remove = (username, callback) => {
  if (typeof username === 'undefined') {
    callback(new Error('user does not exist'), false);
  } else {
    db.has(etcdConfig.userPath(username), (error, res) => {
      if (!res) {
        callback(new Error('user does not exist'), false);
      } else {
        db.get(etcdConfig.userAdminPath(username), (err, res) => {
          if (err !== null) {
            callback(err, false);
          } else {
            if (res.get(etcdConfig.userAdminPath(username)) === 'true') {
              callback(new Error('can not delete admin user'), false);
            } else {
              db.delete(etcdConfig.userPath(username), (error, result) => {
                if (error !== null) {
                  callback(new Error('delete user failed'), false);
                }
                callback(null, true);
              }, {recursive: true});
            }
          }
        });
      }
    });
  }
};

const setDefaultAdmin = () => {
  update(etcdConfig.adminName, etcdConfig.adminPass, true, false, (res, status) => {
    if (!status) {
      throw new Error('unable to set default admin');
    }
  });
};

const prepareStoragePath = () => {
  db.set(etcdConfig.storagePath(), null, (err, res) => {
    if (!err) {
      throw new Error('build storage path failed');
    } else {
      setDefaultAdmin();
    }
  }, {dir: true});
};

if (config.env !== 'test') {
  db.has(etcdConfig.storagePath(), (err, res) => {
    if (!res) {
      prepareStoragePath();
    }
  });

  // db.get(etcdConfig.storagePath(), (err, res) => {
  //   logger.info(etcdConfig.storagePath());
  //   logger.info(res);
  // })

  // db.get(etcdConfig.storagePath(), (err, res) => {
  //   logger.info(etcdConfig.storagePath() + 'recursive');
  //   logger.info(res);
  // },{recursive:true})

  // db.get('/users/admin', (err, res) => {
  //   logger.info('/users/admin');
  //   logger.info(res);
  // })


  // db.get('/users/admin', (err, res) => {
  //   logger.info('/users/admin' + 'recursive');
  //   logger.info(res);
  // },{recursive:true})


  // db.get('/users/admin/admin', (err, res) => {
  //   logger.info('/users/admin');
  //   logger.info(res);
  // })

  // db.get('/users/admin/admin', (err, res) => {
  //   logger.info('/users/admin' + 'recursive');
  //   logger.info(res);
  // },{recursive:true})
}

// module exports
module.exports = {encrypt, db, update, remove};
