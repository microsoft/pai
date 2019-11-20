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
async function search(index = '*', body = '{}', req) {
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
      let resultObj = {items: []};
      for (let i = 0; i < aggResults.length; i++) {
        resultObj['items'].push(
          aggResults[i].CollectTime_sort.buckets[0].top.hits.hits[0]._source
            .ObjectSnapshot,
        );
      }
      res = {
        status: 200,
        data: resultObj,
      };
    }
  }
  return res;
}

// module exports
module.exports = {
  search,
};
