// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';

import config from '../../config/webportal.config';

export async function login(username, password, expires = 7) {
  const client = new PAIV2.OpenPAIClient({
    rest_server_uri: new URL(config.restServerUri, window.location.href),
    https: window.location.protocol === 'https:',
  });

  try {
    const loginInfo = await client.authn.basicLogin(
      username,
      password,
      expires * 24 * 60 * 60,
    );
    cookies.set('user', loginInfo.user, { expires });
    cookies.set('token', loginInfo.token, { expires });
    cookies.set('admin', loginInfo.admin, { expires });
  } catch (err) {
    throw new Error(err.data.message);
  }
}
