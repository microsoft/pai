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

describe('The HDFS module', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  const Hdfs = require('../src/util/hdfs');
  const hdfs = new Hdfs(global.webhdfsUri);
  
  //
  // Positive cases
  //

  it('[P-01] List', (done) => {
    const path = '/foo';
    global.nock(global.webhdfsUri)
      .get('/webhdfs/v1' + path + '?op=LISTSTATUS')
      .reply(
        200,
        {}
      );
    hdfs.list(
      path,
      {},
      (error, result) => {
        expect(error).to.be.equal(null);
        done();
      }
    );
  });

  it('[P-02] Create a folder', (done) => {
    const path = '/foo';
    global.nock(global.webhdfsUri)
      .put('/webhdfs/v1' + path + '?op=MKDIRS')
      .reply(
        200,
        {}
      );
    hdfs.createFolder(
      path,
      {},
      (error, result) => {
        expect(error).to.be.equal(null);
        done();
      }
    );
  });

  it('[P-03] Create a file', (done) => {
    const path = '/foo/bar.txt';
    global.nock(global.webhdfsUri)
      .put('/webhdfs/v1' + path + '?op=CREATE')
      .reply(
        201,
        {}
      );
    hdfs.createFile(
      path,
      'Hello, world!',
      {},
      (error, result) => {
        expect(error).to.be.equal(null);
        done();
      }
    );
  });

  it('[P-04] Create a file (with 307 redirection)', (done) => {
    const path = '/foo/bar.txt';
    global.nock(global.webhdfsUri)
      .put('/webhdfs/v1' + path + '?op=CREATE')
      .reply(
        307,
        null,
        {
          'X-Location': global.webhdfsUri + '/webhdfs/v1/redirected' + path + '?op=CREATE'
        }
      );
    global.nock(global.webhdfsUri)
      .put('/webhdfs/v1/redirected' + path + '?op=CREATE')
      .reply(
        201,
        {}
      );
    hdfs.createFile(
      path,
      'Hello, world!',
      {},
      (error, result) => {
        expect(error).to.be.equal(null);
        done();
      }
    );
  });

  it('[P-05] Read a file', (done) => {
    const path = '/foo/bar.txt';
    global.nock(global.webhdfsUri)
      .get('/webhdfs/v1' + path + '?op=OPEN')
      .reply(
        200,
        {}
      );
    hdfs.readFile(
      path,
      {},
      (error, result) => {
        expect(error).to.be.equal(null);
        done();
      }
    );
  });

  it('[P-06] Read a file (with 307 redirection)', (done) => {
    const path = '/foo/bar.txt';
    global.nock(global.webhdfsUri)
      .get('/webhdfs/v1' + path + '?op=OPEN')
      .reply(
        307,
        null,
        {
          'X-Location': global.webhdfsUri + '/webhdfs/v1/redirected' + path + '?op=OPEN'
        }
      );
    global.nock(global.webhdfsUri)
      .get('/webhdfs/v1/redirected' + path + '?op=OPEN')
      .reply(
        200,
        {}
      );
    hdfs.readFile(
      path,
      {},
      (error, result) => {
        expect(error).to.be.equal(null);
        done();
      }
    );
  });
});
