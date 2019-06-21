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

const unirest = require('unirest');
const axios = require('axios');

class Hdfs {
  constructor(webHdfsRootUrl) {
    this.webHdfsRootUrl = webHdfsRootUrl;
  }

  //
  // Public methods
  //

  list(path, options, next) {
    this._list(this._constructTargetUrl(path, options, 'LISTSTATUS'), next);
  }

  async listAsync(path, options) {
    try {
      return await this._listAxios(this._constructTargetUrl(path, options, 'LISTSTATUS'));
    } catch (error) {
      throw error;
    }
  }

  createFolder(path, options, next) {
    this._createFolder(this._constructTargetUrl(path, options, 'MKDIRS'), next);
  }

  async createFolderAsync(path, options) {
    try {
      return await this._createFolderAxios(this._constructTargetUrl(path, options, 'MKDIRS'));
    } catch (error) {
      throw error;
    }
  }

  createFile(path, data, options, next) {
    this._createFile(this._constructTargetUrl(path, options, 'CREATE'), data, next);
  }

  async createFileAsync(path, data, options) {
    try {
      return await this._createFileAxios(this._constructTargetUrl(path, options, 'CREATE'), data );
    } catch (error) {
      throw error;
    }
  }

  readFile(path, options, next) {
    this._readFile(this._constructTargetUrl(path, options, 'OPEN'), next);
  }

  async readFileAsync(path, options) {
    try {
      return await this._readFileAxios(this._constructTargetUrl(path, options, 'OPEN'));
    } catch (error) {
      throw error;
    }
  }

  //
  // Private methods
  //

  _constructTargetUrl(path, options, operation) {
    let targetUrl = `${this.webHdfsRootUrl}/webhdfs/v1${path}?op=${operation}`;
    if (options) {
      for (let key of Object.keys(options)) {
        targetUrl += `&${key}=${options[key]}`;
      }
    }
    return targetUrl;
  }

  _constructErrorObject(response) {
    if (!response || !response.status) {
      return new Error('[WebHDFS] Empty response.');
    } else {
      return new Error('[WebHDFS] ' + response.status + ' ' + JSON.stringify(response.body));
    }
  }

  async _listAxios(targetUrl) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#List_a_Directory
    try {
      const response = await axios.get(targetUrl);
      return {status: 'succeeded', content: response.body};
    } catch (error) {
      throw error;
    }
  }

  _list(targetUrl, next) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#List_a_Directory
    unirest.get(targetUrl)
      .end((response) => {
        if (response.status === 200) {
          next(null, {status: 'succeeded', content: response.body});
        } else {
          next(this._constructErrorObject(response));
        }
      });
  }

  async _createFolderAxios(targetUrl) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Make_a_Directory
    try {
      const response = await axios.put(targetUrl);
      if (response.status === 2000) {
        return {status: 'succeeded'};
      }
    } catch (error) {
      throw error;
    }
  }

  _createFolder(targetUrl, next) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Make_a_Directory
    unirest.put(targetUrl)
      .end((response) => {
        if (response.status === 200) {
          next(null, {status: 'succeeded'});
        } else {
          next(this._constructErrorObject(response));
        }
      });
  }

  async _createFileAxios(targetUrl, data) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Create_and_Write_to_a_File
    try {
      const response = await axios.put(targetUrl, data);
      if (response.status === 201) {
        return {status: 'succeeded'};
      }
    } catch (error) {
      if (error.response.status === 307) {
        await this._createFileAxios(
          error.response.headers['x-location'] // X-Location header is created in unit test only.
            ? error.response.headers['x-location']
            : error.response.headers['location'],
          data,
        );
      } else {
        throw error;
      }
    }
  }

  _createFile(targetUrl, data, next) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Create_and_Write_to_a_File
    unirest.put(targetUrl)
      .send(data)
      .end((response) => {
        if (response.status === 201) {
          next(null, {status: 'succeeded'});
        } else if (response.status === 307) {
          this._createFile(
            response.headers['x-location'] // X-Location header is created in unit test only.
            ? response.headers['x-location']
            : response.headers['location'],
            data,
            next
          );
        } else {
          next(this._constructErrorObject(response));
        }
      });
  }

  async _readFileAxios(targetUrl) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Open_and_Read_a_File
    try {
      const response = await axios.get(targetUrl);
      return {
        status: 'succeeded',
        content: response.body,
      };
    } catch (error) {
      if (error.response.status === 307) {
        await this._readFileAxios(
          error.response.headers['x-location'] // X-Location header is created in unit test only.
            ? error.response.headers['x-location']
            : error.response.headers['location']
        );
      } else {
        throw error;
      }
    }
  }

  _readFile(targetUrl, next) {
    // Ref: http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html#Open_and_Read_a_File
    unirest.get(targetUrl)
      .end((response) => {
        if (response.status === 200) {
          next(null, {status: 'succeeded', content: response.body});
        } else if (response.status === 307) {
          this._readFile(
            response.headers['x-location'] // X-Location header is created in unit test only.
            ? response.headers['x-location']
            : response.headers['location'],
            next
          );
        } else {
          next(this._constructErrorObject(response));
        }
      });
  }
}

module.exports = Hdfs;
