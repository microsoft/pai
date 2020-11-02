// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { clearToken } from '../../../../user/user-logout/user-logout.component';
import config from '../../../../config/webportal.config';
import urljoin from 'url-join';

const token = cookies.get('token');

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

const wrapper = async func => {
  try {
    return await func();
  } catch (err) {
    if (err.data.code === 'UnauthorizedUserError') {
      alert(err.data.message);
      clearToken();
    } else if (err.data.code === 'NoJobConfigError') {
      throw new NotFoundError(err.data.message);
    } else {
      throw new Error(err.data.message);
    }
  }
};

export async function fetchJobEvents(userName, jobName) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = urljoin(
      restServerUri.toString(),
      `/api/v2/jobs/${userName}~${jobName}/events?type=Warning`,
    );
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return result;
  });
}
