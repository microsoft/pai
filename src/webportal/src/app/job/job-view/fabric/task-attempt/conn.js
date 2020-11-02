// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { clearToken } from '../../../../user/user-logout/user-logout.component';
import config from '../../../../config/webportal.config';
import urljoin from 'url-join';

const absoluteUrlRegExp = /^[a-z][a-z\d+.-]*:/;
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

export async function getContainerLog(logUrl) {
  const ret = {
    fullLogLink: logUrl,
    text: null,
  };
  const res = await fetch(logUrl);
  var text = await res.text();
  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType) {
    throw new Error(`Log not available`);
  }

  // Check log type. The log type is in LOG_TYPE and should be yarn|log-manager.
  if (config.logType === 'yarn') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const content = doc.getElementsByClassName('content')[0];
      const pre = content.getElementsByTagName('pre')[0];
      ret.text = pre.innerText;
      // fetch full log link
      if (pre.previousElementSibling) {
        const link = pre.previousElementSibling.getElementsByTagName('a');
        if (link.length === 1) {
          ret.fullLogLink = link[0].getAttribute('href');
          // relative link
          if (ret.fullLogLink && !absoluteUrlRegExp.test(ret.fullLogLink)) {
            let baseUrl = res.url;
            // check base tag
            const baseTags = doc.getElementsByTagName('base');
            // There can be only one <base> element in a document.
            if (baseTags.length > 0 && baseTags[0].hasAttribute('href')) {
              baseUrl = baseTags[0].getAttribute('href');
              // relative base tag url
              if (!absoluteUrlRegExp.test(baseUrl)) {
                baseUrl = new URL(baseUrl, res.url);
              }
            }
            const url = new URL(ret.fullLogLink, baseUrl);
            ret.fullLogLink = url.href;
          }
        }
      }
      return ret;
    } catch (e) {
      throw new Error(`Log not available`);
    }
  } else if (config.logType === 'log-manager') {
    // Try to get roated log if currently log content is less than 15KB
    if (text.length <= 15 * 1024) {
      const fullLogUrl = logUrl.replace('/tail/', '/full/');
      const rotatedLogUrl = logUrl + '.1';
      const rotatedLogRes = await fetch(rotatedLogUrl);
      const fullLogRes = await fetch(fullLogUrl);
      const rotatedText = await rotatedLogRes.text();
      const fullLog = await fullLogRes.text();
      if (rotatedLogRes.ok && rotatedText.trim() !== 'No such file!') {
        text = rotatedText
          .concat('\n--------log is rotated, may be lost during this--------\n')
          .concat(fullLog);
      }
      // get last 16KB
      text = text.slice(-16 * 1024);
    }
    ret.text = text;
    ret.fullLogLink = logUrl.replace('/tail/', '/full/');
    return ret;
  } else {
    throw new Error(`Log not available`);
  }
}
