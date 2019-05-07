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

import config from '../../config/webportal.config';
import {checkToken} from '../user-auth/user-auth.component';

const fetchWrapper = async (...args) => {
  const res = await fetch(...args);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
};

export const getAllUsersRequest = async () => {
  const url = `${config.restServerUri}/api/v1/user`;
  const token = checkToken();
  return await fetchWrapper(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const removeUserRequest = async (username) => {
  const url = `${config.restServerUri}/api/v1/user`;
  const token = checkToken();
  return await fetchWrapper(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: username,
    }),
  });
};

export const updateUserVcRequest = async (username, virtualCluster) => {
  const url = `${config.restServerUri}/api/v1/user/${username}/virtualClusters`;
  const token = checkToken();
  return await fetchWrapper(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      virtualClusters: virtualCluster,
    }),
  });
};

export const updateUserAccountRequest = async (username, password, admin) => {
  const url = `${config.restServerUri}/api/v1/user`;
  const token = checkToken();
  return await fetchWrapper(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      password,
      admin: admin,
      modify: true,
    }),
  });
};

export const updateUserGithubPATRequest = async (username, githubPAT) => {
  const url = `${config.restServerUri}/api/v1/user/${username}/githubPAT`;
  const token = checkToken();
  return await fetchWrapper(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      githubPAT: githubPAT,
    }),
  });
};
