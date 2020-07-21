// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';
import cookies from 'js-cookie';
import config from '../../config/webportal.config';
import { checkToken } from '../user-auth/user-auth.component';
import { clearToken } from '../user-logout/user-logout.component';

const client = new PAIV2.OpenPAIClient({
  rest_server_uri: new URL(config.restServerUri, window.location.href),
  username: cookies.get('user'),
  token: checkToken(),
  https: window.location.protocol === 'https:',
});

const wrapper = async func => {
  try {
    return await func();
  } catch (err) {
    if (err.data.code === 'UnauthorizedUserError') {
      alert(err.data.message);
      clearToken();
    } else {
      throw new Error(err.data.message);
    }
  }
};

const fetchWrapper = async (...args) => {
  const res = await fetch(...args);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else if (json.code === 'UnauthorizedUserError') {
    alert(json.message);
    clearToken();
  } else {
    throw new Error(json.message);
  }
};

export const getAllUsersRequest = async () => {
  const url = `${config.restServerUri}/api/v2/user`;
  const token = checkToken();
  return fetchWrapper(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeUserRequest = async username => {
  const url = `${config.restServerUri}/api/v2/user/${username}`;
  const token = checkToken();
  return fetchWrapper(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateUserVcRequest = async (username, virtualCluster) => {
  const url = `${config.restServerUri}/api/v2/user/${username}/virtualcluster`;
  const token = checkToken();
  return fetchWrapper(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ virtualCluster }),
  });
};

export const createUserRequest = async (
  username,
  email,
  password,
  admin,
  virtualCluster,
) => {
  const url = `${config.restServerUri}/api/v2/user/`;
  const token = checkToken();
  return fetchWrapper(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, email, password, admin, virtualCluster }),
  });
};

export const updateUserPasswordRequest = async (
  username,
  newPassword,
  oldPassword = undefined,
) => {
  const url = `${config.restServerUri}/api/v2/user/${username}/password`;
  const token = checkToken();
  const result = await fetchWrapper(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword, oldPassword }),
  });
  if (username === cookies.get('user')) {
    clearToken();
  }
  return result;
};

export const updateUserEmailRequest = async (username, email) => {
  const url = `${config.restServerUri}/api/v2/user/${username}/email`;
  const token = checkToken();
  return fetchWrapper(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
};

export const updateUserAdminRequest = async (username, admin) => {
  const url = `${config.restServerUri}/api/v2/user/${username}/admin`;
  const token = checkToken();
  return fetchWrapper(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ admin }),
  });
};

export const getAllVcsRequest = async () => {
  const url = `${config.restServerUri}/api/v2/virtual-clusters`;
  const token = checkToken();
  return fetchWrapper(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getUserRequest = async username => {
  const url = `${config.restServerUri}/api/v2/user/${username}`;
  const token = checkToken();
  return fetchWrapper(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getTokenRequest = async () => {
  return wrapper(() => client.token.getTokens());
};

export const revokeTokenRequest = async token => {
  await wrapper(() => client.token.deleteToken(token));
  if (token === checkToken()) {
    clearToken();
  }
};

export const createApplicationTokenRequest = () =>
  client.token.createApplicationToken();

export const listStorageDetailRequest = async () => {
  return wrapper(async () => {
    const storageSummary = await client.storage.getStorages();
    const details = [];
    for (const storage of storageSummary.storages) {
      details.push(await client.storage.getStorage(storage.name));
    }
    return details;
  });
};
