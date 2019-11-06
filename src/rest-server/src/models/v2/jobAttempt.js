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

// module dependencies
const _ = require('lodash');
const {Client} = require('@elastic/elasticsearch');
const {convertToJobAttempt, convertToJobAttemptDetail} = require('@pai/utils/frameworkConverter');

let elasticSearchClient;
if (!_.isNil(process.env.ELASTICSEARCH_URI)) {
  elasticSearchClient = new Client({node: process.env.ELASTICSEARCH_URI});
}

// job retry only works in k8s launcher and in elastic search exists
const healthCheck = async () => {
  const launcherType = process.env.LAUNCHER_TYPE;
  if (launcherType === 'yarn') {
    return false;
  } else if (_.isNil(elasticSearchClient)) {
    return false;
  } else {
    try {
      const result = await elasticSearchClient.indices.get({
        index: 'framework',
      });
      if (result.statusCode === 200) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
};

// list job retries
const list = async (frameworkName) => {
  if (!healthCheck) {
    return {status: 501, data: null};
  }
  const body = {
    query: {
      bool: {
        filter: {
          term: {
            'objectSnapshot.metadata.name.keyword':
              'dnmpwx31dxz6uubeehgpyqv46crkec1j65hg',
          },
        },
      },
    },
    size: 0,
    aggs: {
      attemptID_group: {
        terms: {
          field: 'objectSnapshot.status.attemptStatus.id',
          order: {
            _key: 'desc',
          },
        },
        aggs: {
          collectTime_latest_hits: {
            top_hits: {
              sort: [
                {
                  collectTime: {
                    order: 'desc',
                  },
                },
              ],
              size: 1,
            },
          },
        },
      },
    },
  };

  const esResult = await elasticSearchClient.search({
    index: 'framework',
    body: body,
  });

  const buckets = esResult.body.aggregations.attemptID_group.buckets;

  if (_.isEmpty(buckets)) {
    return {status: 404, data: null};
  } else {
    const attempts = buckets.map((bucket) => {
      return bucket.collectTime_latest_hits.hits.hits[0]._source.objectSnapshot;
    });
    const retryData = attempts.map((attempt) => {
      return convertToJobAttempt(attempt);
    });
    return {status: 200, data: retryData};
  }
};

const get = async (frameworkName) => {
  // send request to framework controller
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.frameworkPath(encodeName(frameworkName)),
      headers: launcherConfig.requestHeaders,
      httpsAgent: apiserver.ca && new Agent({ca: apiserver.ca}),
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  if (response.status === status('OK')) {
    return await convertFrameworkDetail(response.data);
  }
  if (response.status === status('Not Found')) {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job ${frameworkName} is not found.`,
    );
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

// module exports
module.exports = {
  healthCheck,
  list,
  get,
};
