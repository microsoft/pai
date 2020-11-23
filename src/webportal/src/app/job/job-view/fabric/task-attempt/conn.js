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

export async function fetchTaskStatus(
  userName,
  jobName,
  attemptIndex,
  taskRoleName,
  taskIndex,
) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = urljoin(
      restServerUri.toString(),
      `api/v2/jobs/${userName}~${jobName}/attempts/${attemptIndex}/taskRoles/${taskRoleName}/taskIndex/${taskIndex}/attempts`,
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

export async function getContainerLogList(logListUrl) {
  const res = await Promise.all([
    fetch(`${logListUrl}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    fetch(`${logListUrl}?tail-mode=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ]);
  const resp = res.find(r => !r.ok);
  if (resp) {
    throw new Error('Log folder can not be retrieved');
  }
  const logUrls = await Promise.all(res.map(r => r.json()));
  return {
    fullLogUrls: logUrls[0],
    tailLogUrls: logUrls[1],
  };
}

export async function getContainerLog(tailLogUrls, fullLogUrls, logType) {
  const res = await fetch(tailLogUrls[logType]);
  if (!res.ok) {
    if (String(res.status) === '403') {
      throw new Error(res.status);
    }
    throw new Error(res.statusText);
  }
  let text = await res.text();

  // Check log type. The log type is in LOG_TYPE only support log-manager.
  if (config.logType === 'log-manager') {
    // Try to get roated log if currently log content is less than 15KB
    if (text.length <= 15 * 1024 && tailLogUrls[logType + '.1']) {
      const rotatedLogUrl = tailLogUrls[logType + '.1'];
      const rotatedLogRes = await fetch(rotatedLogUrl);
      const fullLogRes = await fetch(fullLogUrls[logType]);
      const rotatedText = await rotatedLogRes.text();
      const fullLog = await fullLogRes.text();
      if (rotatedLogRes.ok) {
        text = rotatedText
          .concat(
            '\n ------- log is rotated, may be lost during this ------- \n',
          )
          .concat(fullLog);
      }
      // get last 16KB
      text = text.slice(-16 * 1024);
    }
    return {
      fullLogLink: fullLogUrls[logType],
      text: text,
    };
  } else {
    throw new Error(`Log not available`);
  }
}
