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
const createError = require('../util/error');
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
  db.has(etcdConfig.userPath(username), null, (_, res) => {
    if (res !== modify) {
      const status = res ? 'Conflict' : 'Not found';
      const code = res ? 'ConflictUserError' : 'NoUserError';
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
            if (admin !== undefined) {
              setUserAdmin(admin, username, callback);
            } else {
              callback();
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
      callback(createError('Not Found', 'NoUserError', `User ${username} not found.`));
    }
    db.get(etcdConfig.userAdminPath(username), null, (err, res) => {
      if (err) {
        return callback(err);
      }
      if (res.get(etcdConfig.userAdminPath(username)) === 'true') {
        callback(createError('Forbidden', 'RemoveAdminError', `Admin ${username} is not allowed to remove.`));
      } else {
        db.delete(etcdConfig.userPath(username), {recursive: true}, callback);
      }
    });
  });
};

const updateUserVc = (username, virtualClusters, callback) => {
  db.get(etcdConfig.userPath(username), null, (err, res) => {
    if (err) {
      if (err.errorCode === 100) {
        // "Key not found" refer to https://coreos.com/etcd/docs/latest/v2/errorcode.html
        return callback(createError('Not Found', 'NoUserError', `User ${username} not found.`));
      } else {
        return callback(err);
      }
    }
    VirtualCluster.prototype.getVcList((vcList, err) => {
      if (err) {
        return callback(err);
      }
      if (!vcList) {
        return callback(createError.unknown('There is no virtual clusters.'));
      }
      let updateVcList = (res.get(etcdConfig.userAdminPath(username)) === 'true')
        ? Object.keys(vcList)
        : virtualClusters.trim().split(',').filter((updateVc) => (updateVc !== ''));
      let addUserWithInvalidVc = null;
      for (let item of updateVcList) {
        if (!vcList.hasOwnProperty(item)) {
          if (!res.has(etcdConfig.userVirtualClusterPath(username))) {
            updateVcList.length = 0;
            addUserWithInvalidVc = item;
            break;
          } else {
            return callback(createError('Bad Request', 'NoVirtualClusterError', `Virtual cluster ${item} not found.`));
          }
        }
      }
      if (!updateVcList.includes('default')) { // always has 'default' queue
        updateVcList.push('default');
      }
      updateVcList.sort();
      db.set(etcdConfig.userVirtualClusterPath(username), updateVcList.toString(), null, (err, res) => {
        if (err) {
          return callback(err);
        }
        if (addUserWithInvalidVc != null) {
          return callback(createError('Bad Request', 'NoVirtualClusterError', `Virtual cluster ${addUserWithInvalidVc} not found.`));
        }
        callback(null, true);
      });
    });
  });
};

const checkUserVc = (username, virtualCluster, callback) => {
  if (typeof username === 'undefined') {
    callback(createError('Unauthorized', 'UnauthorizedUserError', 'Guest is not allowed to do this operation.'));
  } else {
    virtualCluster = (!virtualCluster) ? 'default' : virtualCluster;
    if (virtualCluster === 'default') {
      callback(null, true); // all users have right access to 'default'
    } else {
      VirtualCluster.prototype.getVcList((vcList, err) => {
        if (err) {
          return callback(err);
        } else if (!vcList) {
          // Unreachable
          logger.warn('list virtual clusters error, no virtual cluster found');
        } else {
          if (!vcList.hasOwnProperty(virtualCluster)) {
            return callback(createError('Not Found', 'NoVirtualClusterError', `Virtual cluster ${virtualCluster} is not found.`));
          }
          db.get(etcdConfig.userVirtualClusterPath(username), null, (err, res) => {
            if (err) {
              return callback(err);
            } else {
              let userVirtualClusters = res.get(etcdConfig.userVirtualClusterPath(username)).trim().split(',');
              for (let item of userVirtualClusters) {
                if (item === virtualCluster) {
                  return callback(null, true);
                }
              }
              callback(createError('Forbidden', 'ForbiddenUserError', `User ${username} is not allowed to do operation in ${virtualCluster}`));
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
