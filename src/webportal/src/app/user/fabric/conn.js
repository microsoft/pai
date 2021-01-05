// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';
import cookies from 'js-cookie';
import config from '../../config/webportal.config';
import { checkToken } from '../user-auth/user-auth.component';
import { clearToken } from '../user-logout/user-logout.component';
import { getDeshuttleStorageDetails } from '../../job-submission/utils/utils';

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

export const updateBoundedClustersRequest = async (
  username,
  updatedBoundedClusters,
) => {
  const url = `${config.restServerUri}/api/v2/users/me`;
  const token = checkToken();
  return fetchWrapper(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        username: username,
        extension: {
          boundedClusters: updatedBoundedClusters,
        },
      },
      patch: true,
    }),
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

export const updateUserRequest = async (username, sskMessage) => {
  const url = `${config.restServerUri}/api/v2/users/me`;
  const token = checkToken();
  return fetchWrapper(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        username: username,
        extension: {
          sshKeys: sskMessage,
        },
      },
      patch: true,
    }),
  });
};

export const getTokenRequest = async () => {
  return wrapper(() => client.token.getTokens());
};

export const getGroupsRequest = async () => {
  return wrapper(() => client.group.getAllGroup());
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
    const token = checkToken();
    for (const storage of storageSummary.storages) {
      const detail = await client.storage.getStorage(storage.name);
      if (detail.type === 'dshuttle') {
        const res = await fetch('dshuttle/api/v1/master/info', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (
            detail.data.dshuttlePath &&
            json.mountPoints[detail.data.dshuttlePath]
          ) {
            detail.data = {
              ...detail.data,
              ...getDeshuttleStorageDetails(
                json.mountPoints[detail.data.dshuttlePath],
              ),
            };
          }
        }
      }

      details.push(detail);
    }
    return details;
  });
};
