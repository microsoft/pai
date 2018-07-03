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
const createError = require('../util/error');

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
  db.has(etcdConfig.userPath(username), null, (_, res) => {
    if (res !== modify) {
      const status = res ? 'Conflict' : 'Not found';
      const code = res ? 'ERR_CONFLICT_USER' : 'ERR_NO_USER';
      const message = res ? `User name ${username} already exists.` : `User ${username} not found.`;
      callback(createError(status, code, message));
    } else {
      encrypt(username, password, (err, derivedKey) => {
        if (err) {
          return callback(err);
        }
        if (modify) {
          db.set(etcdConfig.userPasswdPath(username), derivedKey, {prevExist: true}, (err) => {
            if (err) {
              return callback(err);
            }
            if (typeof admin !== 'undefined') {
              setUserAdmin(admin, username, callback);
            } else {
              callback(null);
            }
          });
        } else {
          db.set(etcdConfig.userPath(username), null, {dir: true}, (err) => {
            if (err) {
              return callback(err);
            }
            db.set(etcdConfig.userPasswdPath(username), derivedKey, null, (err) => {
              if (err) {
                return callback(err);
              }
              setUserAdmin(admin, username, callback);
            });
          });
        }
      });
    }
  });
};

const setUserAdmin = (admin, username, callback) => {
  let isAdmin = (typeof admin === 'undefined') ? false : admin;
  db.set(etcdConfig.userAdminPath(username), isAdmin, null, callback);
};

const remove = (username, callback) => {
  db.has(etcdConfig.userPath(username), null, (_, res) => {
    if (!res) {
      callback(createError('Not Found', 'ERR_NO_USER', `User ${username} not found.`));
    }
    db.get(etcdConfig.userAdminPath(username), null, (err, res) => {
      if (err) {
        return callback(err);
      }
      if (res.get(etcdConfig.userAdminPath(username)) === 'true') {
        callback(createError('Forbidden', 'ERR_REMOVE_ADMIN', `Admin ${username} is not allowed to remove.`));
      } else {
        db.delete(etcdConfig.userPath(username), {recursive: true}, callback);
      }
    });
  });
};

const updateUserVc = (username, virtualClusters, callback) => {
  if (typeof username === 'undefined') {
    callback(new Error('user does not exist'), false);
  } else {
    db.get(etcdConfig.userPath(username), null, (errMsg, res) => {
      if (errMsg) {
        logger.warn('user %s not exists', etcdConfig.userPath(username));
        callback(new Error('UserNotFoundInDatabase'), false);
      } else {
        VirtualCluster.prototype.getVcList((vcList, err) => {
          if (err) {
            callback(new Error('NoVirtualClusterFound'), false);
            logger.warn('get virtual cluster list error\n%s', err.stack);
          } else if (!vcList) {
            callback(new Error('NoVirtualClusterFound'), false);
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
                callback(new Error('UpdateDataFailed'), false);
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
              callback(new Error('VirtualClusterNotFoundInDatabase'), false);
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

const getUserList = (callback) => {
  db.get(etcdConfig.storagePath(), {recursive: true}, (err, res) => {
    if (err) {
      return callback(err);
    }
    const userInfoList = [];
    res.forEach((value, key) => {
      if (value === undefined && key !== etcdConfig.storagePath()) {
        let userName = key.replace(etcdConfig.storagePath() + '/', '');
        userInfoList.push({
          username: userName,
          admin: res.get(etcdConfig.userAdminPath(userName)),
          virtualCluster: res.has(etcdConfig.userVirtualClusterPath(userName)) ? res.get(etcdConfig.userVirtualClusterPath(userName)) : 'default',
        });
      }
    });
    callback(null, userInfoList);
  });
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
      getUserList((errMsg, res) => {
        if (errMsg) {
          logger.warn('get user list failed');
        } else {
          logger.warn(res);
        }
      });
    }
  });
}

// module exports
module.exports = {encrypt, db, update, remove, updateUserVc, checkUserVc, getUserList};
