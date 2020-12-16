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
'use strict';

// module dependencies
const createError = require('@pai/utils/error');
const tokenModel = require('@pai/models/v2/token');
const userModel = require('@pai/models/v2/user');
const authConfig = require('@pai/config/authn');
const querystring = require('querystring');

/**
 * Get the token.
 */
const get = async (req, res, next) => {
  try {
    const username = req.body.username;
    const userInfo = await userModel.getUser(username);
    let admin = false;
    if (userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
      admin = true;
    }
    const token = tokenModel.create(userInfo.username, admin, undefined, 'BASIC', userInfo.username);
    return res.status(200).json({
      user: userInfo.username,
      token: token,
      admin: admin,
      hasGitHubPAT: userInfo.extension.hasOwnProperty('githubPAT') && Boolean(userInfo.extension['githubPAT']),
    });
  } catch (error) {
    if (error.status && error.status === 404) {
      return next(createError('Bad Request', 'NoUserError', `User ${req.params.username} is not found. Please join mtuser security group https://idweb/identitymanagement/aspx/groups/AllGroups.aspx. May take one day to take effect.`));
    }
    return next(createError.unknown(error));
  }
};

/**
 *  Get the token in AAD Mode.
 */
const getAAD = async (req, res, next) => {
  try {
    const username = req.username;
    const userInfo = await userModel.getUser(username);
    let admin = false;
    if (userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
      admin = true;
    }
    const token = tokenModel.create(userInfo.username, admin, undefined, 'AAD', userInfo.username);
    const fromURI = req.fromURI;
    return res.redirect(req.returnBackURI + '?' + querystring.stringify({
      user: userInfo.username,
      token: token,
      admin: admin,
      hasGitHubPAT: userInfo.extension.hasOwnProperty('githubPAT') && Boolean(userInfo.extension['githubPAT']),
      from: fromURI,
    }));
  } catch (error) {
    return next(createError.unknown(error));
  }
};

/**
 *  Create a new MT Token based on an existing MT Token.
 */
const getMT = async (req, res, next) => {
  try {
    const reqUser = req.user.username;
    const reqAdmin = req.user.admin;
    const asAdmin = req.body.admin;
    const expiryDurationSecs = req.body.expiryDurationSecs;

    // Defaulting
    const asUser = req.body.userName ? req.body.userName : reqUser;

    // Validation
    // Only Admin can impersonate
    if (asUser !== reqUser && !reqAdmin) {
      throw new Error(`Current user [${reqUser}] cannot impersonate user [${asUser}]`);
    }
    // Only Admin can get another admin token
    if (asAdmin && !reqAdmin) {
      throw new Error(`Current user [${reqUser}] cannot get admin token`);
    }

    const token = tokenModel.create(asUser, asAdmin, expiryDurationSecs, 'MT', reqUser);
    return res.json({token: token});
  } catch (error) {
    return next(createError('Bad Request', 'UnknownError', error));
  }
};

/**
 *  Get the token Payload.
 */
const getPayload = (req, res, next) => {
  try {
    return res.json(req.user.payload);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// module exports
module.exports = {
  get,
  getAAD,
  getMT,
  getPayload,
};
