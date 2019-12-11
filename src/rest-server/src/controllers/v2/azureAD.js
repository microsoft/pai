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

const authnConfig = require('@pai/config/authn');
const querystring = require('querystring');
const axios = require('axios');
const createError = require('@pai/utils/error');
const jwt = require('jsonwebtoken');

const requestAuthCode = async (req, res, next) => {
  const clientId = authnConfig.OIDCConfig.clientID;
  const responseType = 'code';
  const redirectUri = authnConfig.OIDCConfig.redirectUrl;
  const responseMode = 'form_post';
  let scope = `openid offline_access https://${authnConfig.OIDCConfig.msgraph_host}/user.read`;
  if (authnConfig.groupConfig.groupDataSource === 'ms-graph') {
    scope = `${scope} https://${authnConfig.OIDCConfig.msgraph_host}/directory.read.all`;
  }
  let state = {};
  state.redirect = 'http://' + process.env.WEBPORTAL_URL + '/index.html';
  if (req.query.redirect_uri) {
    state.redirect = req.query.redirect_uri;
  }
  if (req.query.from) {
    state.from = req.query.from;
  }
  const requestURL = authnConfig.OIDCConfig.authorization_endpoint;
  return res.redirect(`${requestURL}?`+ querystring.stringify({
    client_id: clientId,
    response_type: responseType,
    redirect_uri: redirectUri,
    response_mode: responseMode,
    scope: scope,
    state: JSON.stringify(state),
  }));
};

const requestTokenWithCode = async (req, res, next) => {
  try {
    const authCode = req.body.code;
    let scope = `https://${authnConfig.OIDCConfig.msgraph_host}/user.read`;
    if (authnConfig.groupConfig.groupDataSource === 'ms-graph') {
      scope = `${scope} https://${authnConfig.OIDCConfig.msgraph_host}/directory.read.all`;
    }
    const clientId = authnConfig.OIDCConfig.clientID;
    const redirectUri = authnConfig.OIDCConfig.redirectUrl;
    const grantType = 'authorization_code';
    const clientSecret = authnConfig.OIDCConfig.clientSecret;
    const requestUrl = authnConfig.OIDCConfig.token_endpoint;
    const data = {
      client_id: clientId,
      scope: scope,
      code: authCode,
      redirect_uri: redirectUri,
      grant_type: grantType,
      client_secret: clientSecret,
    };
    const response = await axios.post(requestUrl, querystring.stringify(data));
    req.undecodedIDToken = response.data.id_token;
    req.IDToken = jwt.decode(response.data.id_token);
    req.undecodedAccessToken = response.data.access_token;
    req.accessToken = jwt.decode(response.data.access_token);
    req.undecodedRefreshToken = response.data.refresh_token;
    req.refreshToken = jwt.decode(response.data.refresh_token);
    const state = JSON.parse(req.body.state);
    req.returnBackURI = state.redirect;
    req.fromURI = state.from;
    next();
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const parseTokenData = async (req, res, next) => {
  try {
    const email = req.accessToken.upn ? req.accessToken.upn : (req.accessToken.email ? req.accessToken.email: req.accessToken.unique_name);
    const userBasicInfo = {
      email: email,
      username: email.substring(0, email.lastIndexOf('@')),
      oid: req.accessToken.oid,
    };
    req.username = userBasicInfo.username;
    req.userData = userBasicInfo;
    next();
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const signoutAzureAD = async (req, res, next) => {
  res.redirect(authnConfig.OIDCConfig.destroySessionUrl);
};

// module exports
module.exports = {
  requestAuthCode,
  requestTokenWithCode,
  parseTokenData,
  signoutAzureAD,
};
