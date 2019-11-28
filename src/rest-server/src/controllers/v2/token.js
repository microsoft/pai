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
const querystring = require('querystring');
const userModel = require('@pai/models/v2/user');
const groupModel = require('@pai/models/v2/group');
const tokenModel = require('@pai/models/token');
const createError = require('@pai/utils/error');
const {encrypt} = require('@pai/utils/manager/user/user');

/**
 * Get the token.
 */
const get = async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const hash = await encrypt(username, password);
  let userItem;
  try {
    userItem = await userModel.getUser(username);
  } catch (error) {
    if (error.status && error.status === 404) {
      return next(createError('Bad Request', 'NoUserError', `User ${req.body.username} is not found.`));
    }
  }
  if (hash !== userItem['password']) {
    return next(createError('Bad Request', 'IncorrectPasswordError', 'Password is incorrect.'));
  }
  try {
    const admin = await groupModel.getGroupsAdmin(userItem.grouplist);
    const token = await tokenModel.create(username);
    return res.status(200).json({
      user: userItem.username,
      token: token,
      admin: admin,
      hasGitHubPAT: userItem.extension.githubPAT,
    });
  } catch (err) {
    return next(createError.unknown(err));
  }
};

/**
 *  Get the token in AAD Mode.
 */
const getAAD = async (req, res, next) => {
  try {
    const username = req.username;
    const userInfo = await userModel.getUser(username);
    const admin = await userModel.checkAdmin(username);
    const token = await tokenModel.create(username);
    const fromURI = req.fromURI;
    return res.redirect(req.returnBackURI + '?'+ querystring.stringify({
      user: userInfo.username,
      token: token,
      admin: admin,
      hasGitHubPAT: userInfo.extension.githubPAT,
      from: fromURI,
    }));
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// module exports
module.exports = {
  get,
  getAAD,
};
