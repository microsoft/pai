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
const VirtualCluster = require('./vc');

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
    db.has(etcdConfig.userPath(username), null, (errMsg, res) => {
      if (res !== modify) {
        callback(null, false);
      } else {
        encrypt(username, password, (errMsg, derivedKey) => {
          if (errMsg) {
            callback(errMsg, false);
          } else {
            if (modify) {
              db.set(etcdConfig.userPasswdPath(username), derivedKey, {prevExist: true}, (errMsg, res) => {
                if (errMsg) {
                  logger.warn('modify %s password failed. error message:%s', etcdConfig.userPasswdPath(username), errMsg);
                  callback(errMsg, false);
                } else {
                  if (typeof admin !== 'undefined') {
                    setUserAdmin(admin, username, (errMsg, res) => {
                      callback(errMsg, res);
                    });
                  } else {
                    callback(null, true);
                  }
                }
              });
            } else {
              db.set(etcdConfig.userPath(username), null, {dir: true}, (errMsg, res) => {
                if (errMsg) {
                  logger.warn('create %s user directory failed. error message:%s', etcdConfig.userPath(username), errMsg);
                  callback(errMsg, false);
                }
                db.set(etcdConfig.userPasswdPath(username), derivedKey, null, (errMsg, result) => {
                  if (errMsg) {
                    logger.warn('set %s password failed. error message:%s', etcdConfig.userPasswdPath(username), errMsg);
                    callback(errMsg, false);
                  } else {
                    setUserAdmin(admin, username, (errMsg, res) => {
                      callback(errMsg, res);
                    });
                  }
                });
              });
            }
          }
        });
      }
    });
  }
};

const setUserAdmin = (admin, username, callback) => {
  let isAdmin = (typeof admin === 'undefined') ? false : admin;
  db.set(etcdConfig.userAdminPath(username), isAdmin, null, (errMsg, res) => {
    if (errMsg) {
      logger.warn('set %s admin failed. error message:%s', etcdConfig.userAdminPath(username), errMsg);
      callback(errMsg, false);
    } else {
      callback(null, true);
    }
  });
};

const remove = (username, callback) => {
  if (typeof username === 'undefined') {
    callback(new Error('user does not exist'), false);
  } else {
    db.has(etcdConfig.userPath(username), null, (errMsg, res) => {
      if (!res) {
        callback(new Error('user does not exist'), false);
      } else {
        db.get(etcdConfig.userAdminPath(username), null, (errMsg, res) => {
          if (errMsg) {
            callback(errMsg, false);
          } else {
            if (res.get(etcdConfig.userAdminPath(username)) === 'true') {
              callback(new Error('can not delete admin user'), false);
            } else {
              db.delete(etcdConfig.userPath(username), {recursive: true}, (errMsg, result) => {
                if (errMsg) {
                  callback(new Error('delete user failed'), false);
                }
                callback(null, true);
              });
            }
          }
        });
      }
    });
  }
};

const updateUserVc = (username, virtualClusters, callback) => {
  if (typeof username === 'undefined') {
    callback(new Error('user does not exist'), false);
  } else {
    db.get(etcdConfig.userPath(username), null, (errMsg, res) => {
      if (errMsg) {
        logger.warn('user %s not exists', etcdConfig.userPath(username));
        callback(errMsg, false);
      } else {
        VirtualCluster.prototype.getVcList((vcList, err) => {
          if (err) {
            logger.warn('get virtual cluster list error\n%s', err.stack);
          } else if (!vcList) {
            logger.warn('list virtual clusters error, no virtual cluster found');
          } else {
            let updateVcList = (res.get(etcdConfig.userAdminPath(username)) === 'true') ? Object.keys(vcList) : virtualClusters.trim().split(',').filter((updateVc) => (updateVc !== ''));
            let addUserWithInvalidVc = false;
            for (let item of updateVcList) {
              if (!vcList.hasOwnProperty(item)) {
                if (!res.has(etcdConfig.userVirtualClusterPath(username))) {
                  updateVcList.length = 0;
                  addUserWithInvalidVc = true;
                  break;
                } else {
                  return callback(new Error('InvalidVirtualCluster'), false);
                }
              }
            }
            if (!updateVcList.includes('default')) { // always has 'default' queue
              updateVcList.push('default');
            }
            updateVcList.sort();
            db.set(etcdConfig.userVirtualClusterPath(username), updateVcList.toString(), null, (errMsg, res) => {
              if (errMsg) {
                logger.warn('update %s virtual cluster: %s failed, error message:%s', etcdConfig.userVirtualClusterPath(username), errMsg);
                callback(errMsg, false);
              } else {
                if (addUserWithInvalidVc) {
                  callback(new Error('InvalidVirtualCluster'), false);
                } else {
                  callback(null, true);
                }
              }
            });
          }
        });
      }
    });
  }
};

const checkUserVc = (username, virtualCluster, callback) => {
  if (typeof username === 'undefined') {
    callback(new Error('user does not exist'), false);
  } else {
    virtualCluster = (!virtualCluster) ? 'default' : virtualCluster;
    if (virtualCluster === 'default') {
      callback(null, true); // all users have right access to 'default'
    } else {
      VirtualCluster.prototype.getVcList((vcList, err) => {
        if (err) {
          logger.warn('get virtual cluster list error\n%s', err.stack);
        } else if (!vcList) {
          logger.warn('list virtual clusters error, no virtual cluster found');
        } else {
          if (!vcList.hasOwnProperty(virtualCluster)) {
            return callback(new Error('VirtualClusterNotFound'), false);
          }
          db.get(etcdConfig.userVirtualClusterPath(username), null, (errMsg, res) => {
            if (errMsg || !res) {
              callback(errMsg, false);
            } else {
              let userVirtualClusters = res.get(etcdConfig.userVirtualClusterPath(username)).trim().split(',');
              for (let item of userVirtualClusters) {
                if (item === virtualCluster) {
                  return callback(null, true);
                }
              }
              callback(new Error('NoRightAccessVirtualCluster'), false);
            }
          });
        }
      });
    }
  }
};

const setDefaultAdmin = (callback) => {
  update(etcdConfig.adminName, etcdConfig.adminPass, true, false, (res, status) => {
    if (!status) {
      throw new Error('unable to set default admin');
    } else {
      updateUserVc(etcdConfig.adminName, '', (errMsg, res) => {
        if (errMsg || !res) {
          throw new Error('unable to set default admin virtual cluster');
        }
      });
    }
  });
};

const prepareStoragePath = () => {
  db.set(etcdConfig.storagePath(), null, {dir: true}, (errMsg, res) => {
    if (errMsg) {
      throw new Error('build storage path failed');
    } else {
      setDefaultAdmin();
    }
  });
};

if (config.env !== 'test') {
  db.has(etcdConfig.storagePath(), null, (errMsg, res) => {
    if (!res) {
      prepareStoragePath();
    } else {
      logger.info('base storage path exists');
    }
  });
}

// module exports
module.exports = {encrypt, db, update, remove, updateUserVc, checkUserVc};
