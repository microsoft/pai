// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { PAIV2 } = require('@microsoft/openpai-js-sdk');
const querystring = require('querystring');
const webportalConfig = require('../../config/webportal.config.js');

const userLogout = async (origin = window.location.href) => {
  const client = new PAIV2.OpenPAIClient({
    rest_server_uri: new URL(
      webportalConfig.restServerUri,
      window.location.href,
    ).href,
    https: window.location.protocol === 'https:',
  });

  // revoke token
  const token = cookies.get('token');
  try {
    await client.token.deleteToken(token);
  } catch (err) {
    console.error(err);
  }
  // clear cookies
  cookies.remove('user');
  cookies.remove('token');
  cookies.remove('admin');
  cookies.remove('my-jobs');
  // redirect
  if (webportalConfig.authnMethod === 'basic') {
    if (!origin) {
      window.location.replace('/index.html');
    } else {
      window.location.replace(
        `/index.html?${querystring.stringify({ from: origin })}`,
      );
    }
  } else {
    location.href = webportalConfig.restServerUri + '/api/v2/authn/oidc/logout';
  }
};

/**
 * Clear local tokens only, will not redirect user to oidc logout page
 * @description Will try to refresh the token if oidc enabled.
 * @param {string} origin - redirect target after login
 */
const clearToken = (origin = window.location.href) => {
  cookies.remove('user');
  cookies.remove('token');
  cookies.remove('admin');
  cookies.remove('my-jobs');
  if (!origin) {
    window.location.replace('/index.html');
  } else {
    window.location.replace(
      `/index.html?${querystring.stringify({ from: origin })}`,
    );
  }
};

module.exports = { userLogout, clearToken };
