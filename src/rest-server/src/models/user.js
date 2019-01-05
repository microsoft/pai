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
const secretConfig = require('../config/secret');
const createError = require('../util/error');
const logger = require('../config/logger');
const VirtualCluster = require('./vc');
const util = require('util');

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

const db = dbUtility.getStorageObject('UserSecret', {
  'paiUserNameSpace': secretConfig.paiUserNameSpace,
  'requestConfig': secretConfig.requestConfig(),
});

const update = (username, password, admin, modify, next) => {
  const dbGet = util.callbackify(db.get.bind(db));
  dbGet(username, null, (err, res) => {
    if (err && err.status !== 404) {
      return next(err);
    }

    let userExists = (err && err.status === 404) ? false : true;
    if (userExists !== modify) {
      const status = res ? 'Conflict' : 'Not found';
      const code = res ? 'ConflictUserError' : 'NoUserError';
      const message = res ? `User name ${username} already exists.` : `User ${username} not found.`;
      next(createError(status, code, message));
    } else {
      const dbSet = util.callbackify(db.set.bind(db));
      let options = modify ? {'update': true} : {};
      let updateUser = modify ? res[0] : {};
      updateUser['username'] = username;
      updateUser['password'] = password ? encrypt(username, password) : updateUser['password'];
      if (modify) {
        updateUser['admin'] = (admin === undefined) ? updateUser['admin'] : `${admin}`;
      } else {
        updateUser['admin'] = (admin === undefined) ? 'false' : `${admin}`;
      }
      // Will grant admin user all VC permission
      if (updateUser['admin'] === 'true') {
        VirtualCluster.prototype.getVcList((vcList, err) => {
          if (err) {
            return next(err);
          }
          if (!vcList) {
            return next(createError.unknown(`Update Admin ${username} failed. There is no virtual cluster found.`));
          }
          updateUser['virtualCluster'] = Object.keys(vcList).sort().toString();
          dbSet(username, updateUser, options, (err, res) => {
            if (err) {
              return next(err);
            }
            next();
          });
        });
      } else {
        dbSet(username, updateUser, options, (err, res) => {
          if (err) {
            return next(err);
          }
          next();
        });
      }
    }
  });
};

const remove = (username, next) => {
  const dbGet = util.callbackify(db.get.bind(db));
  dbGet(username, null, (err, res) => {
    if (err && err.status === 404) {
      return next(createError('Not Found', 'NoUserError', `User ${username} not found.`));
    } else if (err) {
      return next(err);
    }
    if (res[0]['admin'] === 'true') {
      next(createError('Forbidden', 'RemoveAdminError', `Admin ${username} is not allowed to remove.`));
    } else {
      const dbDelete = util.callbackify(db.delete.bind(db));
      dbDelete(username, (err, res) => {
        if (err) {
          return next(err);
        }
        next(null, res);
      });
    }
  });
};

const updateUserVc = (username, virtualClusters, next) => {
  const dbGet = util.callbackify(db.get.bind(db));
  dbGet(username, null, (err, res) => {
    if (err) {
      if (err.status === 404) {
        return next(createError('Not Found', 'NoUserError', `User ${username} not found.`));
      } else {
        return next(err);
      }
    }
    if (res[0]['admin'] === 'true') {
      return next(createError('Forbidden', 'ForbiddenUserError', 'Admin\'s virtual clusters cannot be updated.'));
    }
    VirtualCluster.prototype.getVcList((vcList, err) => {
      if (err) {
        return next(err);
      }
      if (!vcList) {
        return next(createError.unknown('There is no virtual clusters.'));
      }
      let updateVcList = virtualClusters.trim().split(',').filter((updateVc) => (updateVc !== ''));
      let addUserWithInvalidVc = null;
      for (let item of updateVcList) {
        if (!vcList.hasOwnProperty(item)) {
          if (!res[0].hasOwnProperty('virtualCluster') || !res[0]['virtualCluster']) {
            // for the new user we need to add default vc
            updateVcList.length = 0;
            addUserWithInvalidVc = item;
            break;
          } else {
            return next(createError('Bad Request', 'NoVirtualClusterError', `Virtual cluster ${item} not found.`));
          }
        }
      }
      if (!updateVcList.includes('default')) { // always has 'default' queue
        updateVcList.push('default');
      }
      updateVcList.sort();
      const dbSet = util.callbackify(db.set.bind(db));
      res[0]['virtualCluster'] = updateVcList.toString();
      dbSet(username, res[0], {'update': true}, (err, res) => {
        if (err) {
          return next(err);
        }
        if (addUserWithInvalidVc != null) {
          return next(createError('Bad Request', 'NoVirtualClusterError', `Virtual cluster ${addUserWithInvalidVc} not found.`));
        }
        next(null, true);
      });
    });
  });
};

const checkUserVc = (username, virtualCluster, next) => {
  if (typeof username === 'undefined') {
    next(createError('Unauthorized', 'UnauthorizedUserError', 'Guest is not allowed to do this operation.'));
  } else {
    virtualCluster = (!virtualCluster) ? 'default' : virtualCluster;
    if (virtualCluster === 'default') {
      next(null, true); // all users have right access to 'default'
    } else {
      VirtualCluster.prototype.getVcList((vcList, err) => {
        if (err) {
          return next(err);
        } else {
          if (!vcList.hasOwnProperty(virtualCluster)) {
            return next(createError('Not Found', 'NoVirtualClusterError', `Virtual cluster ${virtualCluster} is not found.`));
          }
          const dbGet = util.callbackify(db.get.bind(db));
          dbGet(username, null, (err, res) => {
            if (err) {
              return next(err);
            }
            // Admin user can have right to all virtual cluster
            if (res[0]['admin'] === 'true') {
              return next(null, true);
            }
            let userVirtualClusters = res[0]['virtualCluster'].trim().split(',');
            for (let item of userVirtualClusters) {
              if (item === virtualCluster) {
                return next(null, true);
              }
            }
            next(createError('Forbidden', 'ForbiddenUserError', `User ${username} is not allowed to do operation in ${virtualCluster}`));
          });
        }
      });
    }
  }
};

const updateUserGithubPAT = (username, githubPAT, next) => {
  const dbGet = util.callbackify(db.get.bind(db));
  dbGet(username, null, (err, res) => {
    if (err) {
      if (err.status === 404) {
        return next(createError('Not Found', 'NoUserError', `User ${username} not found.`));
      } else {
        return next(err);
      }
    }
    const dbSet = util.callbackify(db.set.bind(db));
    res[0]['githubPAT'] = githubPAT;
    dbSet(username, res[0], {'update': true}, (err, res) => {
      if (err) {
        return next(err);
      }
      next(null, true);
    });
  });
};

const getUserGithubPAT = (username, next) => {
  if (typeof username === 'undefined') {
    next(createError('Unauthorized', 'UnauthorizedUserError', 'Guest is not allowed to do this operation.'));
  } else {
    const get = util.callbackify(db.get.bind(db));
    get(username, null, (err, res) => {
      if (err) {
        return next(err);
      }
      let githubPAT = res[0]['data']['githubPAT'];
      next(null, githubPAT);
    });
  }
};

const getUserList = (next) => {
  const get = util.callbackify(db.get.bind(db));
  get('', null, (err, res) => {
    if (err) {
      return next(err);
    }
    const userInfoList = [];
    res.forEach((item) => {
      userInfoList.push({
        username: item['username'],
        admin: item['admin'],
        virtualCluster: item['virtualCluster'],
        hasGithubPAT: item['githubPAT'] ? true : false,
      });
    });
    next(null, userInfoList);
  });
};

const setDefaultAdmin = () => {
  update(secretConfig.adminName, secretConfig.adminPass, true, false, (err, res) => {
    if (err) {
      throw new Error('unable to set default admin');
    } else {
      logger.info('Create default admin succeed');
    }
  });
};

if (config.env !== 'test') {
  const dbCheckBasePath = util.callbackify(db.checkBasePath.bind(db));
  dbCheckBasePath((err, res) => {
    if (err) {
      if (err.status === 404) {
        const dbPrepareBasePath = util.callbackify(db.prepareBasePath.bind(db));
        dbPrepareBasePath((err, res) => {
          if (err) {
            throw new Error('build storage base path failed');
          }
          setDefaultAdmin();
        });
      } else {
        throw new Error('Check user info storage base path failed');
      }
    } else {
      getUserList((errMsg, userInfoList) => {
        if (errMsg) {
          logger.warn('get user list failed', errMsg);
        } else {
          logger.warn('users:', userInfoList);
          if (userInfoList.length === 0) {
            setDefaultAdmin();
          }
        }
      });
    }
  });
}

// module exports
module.exports = {encrypt, db, update, remove, updateUserVc, checkUserVc, getUserList, updateUserGithubPAT, getUserGithubPAT};
