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

const querystring = require('querystring');
const webportalConfig = require('../../config/webportal.config.js');

const userLogout = (origin = window.location.href) => {
  // revoke token
  const token = cookies.get('token');
  const url = `${webportalConfig.restServerUri}/api/v1/token/${token}`;
  fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(console.err);
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
    location.href = webportalConfig.restServerUri + '/api/v1/authn/oidc/logout';
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
