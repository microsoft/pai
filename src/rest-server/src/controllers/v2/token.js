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

// module dependencies
const jwt = require('jsonwebtoken');
const tokenConfig = require('../../config/token');
const tokenModel = require('../../models/token');
const createError = require('../../util/error');
const userModel = require('../../models/v2/user');



function jwtSignPromise(userinfo, expiration = 7 * 24 * 60 * 60) {
  return new Promise( (res, rej) => {
    if
    jwt.sign({
      username: userinfo.username,
      admin: admin,
    }, tokenConfig.secret, {expiresIn: expiration}, (signError, token) => {
      if (signError) {
        return next(createError.unknown(signError));
      }
      return res.status(200).json({
        user: username,
        token: token,
        admin: admin,
        hasGitHubPAT: hasGitHubPAT,
      });
    });
    crypto.pbkdf2(password, salt, iterations, keylen, 'sha512', (err, key) => {
      err ? rej(err) : res(key);
    });
  });
}


/**
 * Get the token.
 */
const get = async (req, res, next) => {
  try {
    const username = req.userData.username;
    const userInfo = await userModel.getUser(username);

  } catch (error) {
    return next(createError.unknown(error));
  }


  tokenModel.check(username,
    , (err, state, admin, hasGitHubPAT) => {
    if (err) {
      return next(createError.unknown(err));
    }
    if (!state) {
      return next(createError('Bad Request', 'IncorrectPasswordError', 'Password is incorrect.'));
    }
    jwt.sign({
      username: username,
      admin: admin,
    }, tokenConfig.secret, {expiresIn: expiration}, (signError, token) => {
      if (signError) {
        return next(createError.unknown(signError));
      }
      return res.status(200).json({
        user: username,
        token: token,
        admin: admin,
        hasGitHubPAT: hasGitHubPAT,
      });
    });
  });
};

// module exports
module.exports = {get};
