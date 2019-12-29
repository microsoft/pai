import yaml from 'js-yaml';

const webportalConfig = require('../../../config/webportal.config');
const serverUri = webportalConfig.restServerUri;

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

export async function createMarketItem(marketItem) {
  const url = `${serverUri}/api/v2/marketplace/items`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: marketItem.name,
      author: marketItem.author,
      category: marketItem.category,
      introduction: marketItem.introduction,
      description: marketItem.description,
      jobConfig: marketItem.jobConfig,
      submits: marketItem.submits,
      starNumber: marketItem.stars,
      tags: marketItem.tags,
    }),
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json);
  }
}

export async function fetchJobConfig(userName, jobName) {
  const url = userName
    ? `${serverUri}/api/v2/jobs/${userName}~${jobName}/config`
    : `${serverUri}/api/v1/jobs/${jobName}/config`;
  const res = await fetch(url);
  const text = await res.text();
  const json = yaml.safeLoad(text);
  if (res.ok) {
    return json;
  } else {
    if (json.code === 'NoJobConfigError') {
      throw new NotFoundError(json.message);
    } else {
      throw new Error(json.message);
    }
  }
}
