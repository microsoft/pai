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
const unirest = require('unirest');

class Hdfs {
  constructor(webHdfsRootUrl) {
    this.webHdfsRootUrl = webHdfsRootUrl;
  }

  createFolder(path, options, next/*(responseBodyJson, error)*/) {
    let targetUrl = this.webHdfsRootUrl + '/webhdfs/v1' + path + '?op=MKDIRS';
    for (let key in options) {
      targetUrl += '&' + key + '=' + options[key];
    }
    try {
      unirest.put(targetUrl)
      .end((response) => {
        if (response.status === 200) {
          next({status: 'succeeded'}, null);
        } else {
          next(null, new Error('InternalServerError'));
        }
      });
    } catch (error) {
      next(null, error);
    }
  }

  createFile(path, data, options, next/*(responseBodyJson, error)*/) {
    let targetUrl = this.webHdfsRootUrl + '/webhdfs/v1' + path + '?op=CREATE';
    for (let key in options) {
      targetUrl += '&' + key + '=' + options[key];
    }
    try {
      unirest.put(targetUrl)
      .send(data)
      .end((response1) => {
        if (response1.status === 201) {
          next({status: 'succeeded'}, null);
        } else if (response1.status == 307) {
          unirest.put(response1.headers.location)
          .send(data)
          .end((response2) => {
            if (response2.status === 201) {
              next({status: 'succeeded'}, null);
            } else {
              next(null, new Error('InternalServerError'));
            }
          });
        } else {
          next(null, new Error('InternalServerError'));
        }
      });
    } catch (error) {
      next(null, error);
    }
  }

  readFile(path, options, next) {
    let targetUrl = this.webHdfsRootUrl + '/webhdfs/v1' + path + '?op=OPEN';
    for (let key in options) {
      targetUrl += '&' + key + '=' + options[key];
    }
    try {
      unirest.get(targetUrl)
      .end((response) => {
        if (response.status === 200) {
          next({status: 'succeeded', content: response.body}, null);
        } else {
          next(null, new Error('InternalServerError'));
        }
      });
    } catch (error) {
      next(null, error);
    }
  }
}

module.exports = Hdfs;
