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
const elasticsearch = require('@elastic/elasticsearch');

const client = new elasticsearch.Client({nodes: process.env.Elasticsearch_URI});

/**
 *  search framework
 */
async function frameworkSearch(index='*', body='{}', req) {
  const esResult = await client.search({
    index: index,
    body: body,
  });
  let res;
  if (req == 'attemptID') {
    if (esResult.body.hits.hits.length == 0) {
      res = {
        status: 404,
        data: {
          message: `The specified ${index} is not found`,
        },
      };
    } else {
      res = {
        status: 200,
        data: esResult.body.hits.hits[0]._source.ObjectSnapshot,
      };
    }
  } else {
    let aggResults = esResult.body.aggregations.attemptID_group.buckets;
    if (aggResults.length == 0) {
      res = {
        status: 404,
        data: {
          message: `The specified ${index} is not found`,
        },
      };
    } else {
      let resultObj = {'items': []};
      for (let i = 0; i < aggResults.length; i++) {
        resultObj['items'].push(aggResults[i].CollectTime_sort.buckets[0].top.hits.hits[0]._source.ObjectSnapshot);
      }
      res = {
        status: 200,
        data: resultObj,
      };
    }
  }
  return res;
};

/**
 *  search pod
 */
async function podSearch(index='*', body='{}', req) {
  const esResult = await client.search({
    index: index,
    body: body,
  });
  let res;
  if (esResult.body.hits.hits.length == 0) {
    res = {
      status: 404,
      data: {
        message: `The specified ${index} is not found`,
      },
    }
  } else if (req == 'last') {
    res = {
      status: 200,
      data: esResult.body.hits.hits[0]._source.ObjectSnapshot,
    };
  } else {
    let resultObj = {'items': []};
    for (let i = 0; i < esResult.body.hits.hits.length; i++) {
      resultObj['items'].push(esResult.body.hits.hits[i]._source.ObjectSnapshot);
    }
    res = {
      status: 200,
      data: resultObj,
    };
  }
  return res;
};

/**
 *  GET Framework All History Snapshots by FrameworkNamespace & FrameworkName
 */
const getFrameworkByName = async (frameworkNamespace, frameworkName) => {
  let index = 'framework';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.namespace.keyword': frameworkNamespace,
                },
              },
              {
                'term': {
                  'ObjectSnapshot.metadata.name.keyword': frameworkName,
                },
              },
            ],
          },
        },
      },
    },
    'size': 0,
    'aggs': {
      'attemptID_group': {
        'terms': {
          'field': 'ObjectSnapshot.status.attemptStatus.id',
          'order': {
            '_key': 'desc',
          },
        },
        'aggs': {
          'CollectTime_sort': {
            'terms': {
              'field': 'CollectTime',
              'order': {
                '_key': 'desc',
              },
            },
            'aggs': {
              'top': {
                'top_hits': {
                  'size': 1,
                },
              },
            },
          },
        },
      },
    },
  };
  return await frameworkSearch(index, body, '');
};

/**
 *  GET Framework All History Snapshots by FrameworkUID
 */
const getFrameworkByUID = async (frameworkUID) => {
  let index = 'framework';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.uid.keyword': frameworkUID,
                },
              },
            ],
          },
        },
      },
    },
    'size': 0,
    'aggs': {
      'attemptID_group': {
        'terms': {
          'field': 'ObjectSnapshot.status.attemptStatus.id',
          'order': {
            '_key': 'desc',
          },
        },
        'aggs': {
          'CollectTime_sort': {
            'terms': {
              'field': 'CollectTime',
              'order': {
                '_key': 'desc',
              },
            },
            'aggs': {
              'top': {
                'top_hits': {
                  'size': 1,
                },
              },
            },
          },
        },
      },
    },
  };
  return await frameworkSearch(index, body, '');
};

/**
 *  GET Framework One Attempt History Snapshot by FrameworkNamespace & FrameworkName & FrameworkAttemptID
 */
const getFrameworkByNameAndAttemptID = async (frameworkNamespace, frameworkName, frameworkAttemptID) => {
  let index = 'framework';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.namespace.keyword': frameworkNamespace,
                }
              },
              {
                'term': {
                  'ObjectSnapshot.metadata.name.keyword': frameworkName,
                }
              },
              {
                'term': {
                  'ObjectSnapshot.status.attemptStatus.id': frameworkAttemptID,
                },
              },
            ],
          },
        },
      },
    },
    'sort': {
      'CollectTime': 'desc',
    },
    'size': 1,
  };
  return await frameworkSearch(index, body, 'attemptID');
};

/**
 *  GET Framework One Attempt History Snapshot by FrameworkUID & FrameworkAttemptID
 */
const getFrameworkByUIDAndAttemptID = async (frameworkUID, frameworkAttemptID) => {
  let index = 'framework';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.uid.keyword': frameworkUID,
                },
              },
              {
                'term': {
                  'ObjectSnapshot.status.attemptStatus.id': frameworkAttemptID,
                },
              },
            ],
          },
        },
      },
    },
    'sort': {
      'CollectTime': 'desc',
    },
    'size': 1
  };
  return await frameworkSearch(index, body, 'attemptID');
};

/**
 *  GET Pod All History Snapshots by PodNamespace & PodName
 */
const getPodByName = async (podNamespace, podName) => {
  let index = 'pod';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.namespace.keyword': podNamespace,
                },
              },
              {
                'term': {
                  'ObjectSnapshot.metadata.name.keyword': podName,
                },
              },
            ],
          },
        },
      },
    },
  };
  return await podSearch(index, body, '');
};

/**
 *  GET Pod All History Snapshots by PodUID
 */
const getPodByUID = async (podUID) => {
  let index = 'pod';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.uid.keyword': podUID,
                },
              },
            ],
          },
        },
      },
    },
    'sort': {
      'CollectTime': 'desc',
    },
    'size': 10000,
  };
  return await podSearch(index, body, '');
};

/**
 *  GET Pod Last History Snapshot by PodNamespace & PodName
 */
const getPodByNameLast = async (podNamespace, podName) => {
  let index = 'pod';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.namespace.keyword': podNamespace,
                },
              },
              {
                'term': {
                  'ObjectSnapshot.metadata.name.keyword': podName,
                },
              },
            ],
          },
        },
      },
    },
    'sort': {
      'CollectTime': 'desc',
    },
    'size': 1,
  };
  return await podSearch(index, body, 'last');
};

/**
 *  GET Pod Last History Snapshot by PodUID
 */
const getPodByUIDLast = async (podUID) => {
  let index = 'pod';
  let body = {
    'query': {
      'bool': {
        'filter': {
          'bool': {
            'must': [
              {
                'term': {
                  'ObjectSnapshot.metadata.uid.keyword': podUID,
                },
              },
            ],
          },
        },
      },
    },
    'sort': {
      'CollectTime': 'desc',
    },
    'size': 1,
  };
  return await podSearch(index, body, 'last');
};

// module exports
module.exports = {
  getFrameworkByName,
  getFrameworkByUID,
  getFrameworkByNameAndAttemptID,
  getFrameworkByUIDAndAttemptID,
  getPodByName,
  getPodByUID,
  getPodByNameLast,
  getPodByUIDLast,
};
