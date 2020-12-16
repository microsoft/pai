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
"use strict";

import {defaultRestServerClient} from '../../common/http-client';

async function requestWrapper(url, options) {
  try {
    return await defaultRestServerClient.request(url, options);
  } catch (err) {
    if (err.response && err.response.data.code === 'UnauthorizedUserError') {
      alert(err.response.data.message);
      userLogout();
    } else {
      throw err;
    }
  }
}

export const getAllUsersRequest = async () => {
  const url = '/api/v2/user';
  return await requestWrapper(url);
};

export const removeUserRequest = async (username) => {
  const url = `/api/v2/user/${username}`;
  return await requestWrapper(url, {
    method: 'DELETE',
  });
};

export const updateUserVcRequest = async (username, virtualCluster) => {
  const url = `/api/v2/user/${username}/virtualcluster`;
  return await requestWrapper(url, {
    method: 'PUT',
    data: {virtualCluster},
  });
};

export const createUserRequest = async (username, email, password, admin, virtualCluster) => {
  const url = '/api/v2/user/';
  return await requestWrapper(url, {
    method: 'POST',
    data: {username, email, password, admin, virtualCluster},
  });
};

export const updateUserPasswordRequest = async (username, newPassword) => {
  const url = `/api/v2/user/${username}/password`;
  return await requestWrapper(url, {
    method: 'PUT',
    data: {newPassword},
  });
};

export const updateUserEmailRequest = async (username, email) => {
  const url = `/api/v2/user/${username}/email`;
  return await requestWrapper(url, {
    method: 'PUT',
    data: {email},
  });
};

export const updateUserAdminRequest = async (username, admin) => {
  const url = `/api/v2/user/${username}/admin`;
  return await requestWrapper(url, {
    method: 'PUT',
    data: {admin},
  });
};

export const getAllVcsRequest = async () => {
  const url = '/api/v1/virtual-clusters';
  return await requestWrapper(url);
};
