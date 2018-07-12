// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the 'Software'), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
const yaml = require('js-yaml');
const fs = require('fs');
const logger = require('../src/config/logger');

describe('Submit job: POST /api/v1/jobs', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  //
  // Define data
  //

  const validToken = global.jwt.sign(
    {
      username: 'user1',
      admin: false,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: 60,
    }
  );

  const invalidToken = '';

  //
  // Define functions to prepare nock interceptors
  //

  const prepareNockForCaseP01 = (jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${jobName}`)
      .reply(
        404,
        {}
      );
    global.nock(global.launcherWebserviceUri)
      .put(`/v1/Frameworks/${jobName}`)
      .reply(
        202,
        {}
      );
    global.nock(global.webhdfsUri)
      .put(/op=MKDIR/)
      .times(6)
      .reply(
        200,
        {}
      );
    global.nock(global.webhdfsUri)
      .put(/op=CREATE/)
      .times(4)
      .reply(
        201,
        {}
      );
    };

    //
    // Positive cases
    //
  
    it('[P-01] Submit a job to the default vc', (done) => {
      prepareNockForCaseP01('new_job');
      let jobConfig = yaml.load(fs.readFileSync("marketplace/tensorflow_cifar10.yaml", {encoding: 'utf-8'}));
      jobConfig = JSON.stringify(jobConfig, null, 2);
      global.chai.request(global.server)
        .post('/api/v1/jobs')
        .set('Authorization', 'Bearer ' + validToken)
        .send(JSON.parse(jobConfig))
        .end((err, res) => {
          global.chai.expect(res, 'status code').to.have.status(202);
          global.chai.expect(res, 'response format').be.json;
          global.chai.expect(res.body.message, 'response message').equal('update job new_job successfully');
          done();
        });
    });
  
    //
    // Negative cases
    //
    /*
    it('[N-02] Schema checking failed', (done) => {
      global.chai.request(global.server)
        .post('/api/v1/jobs')
        .set('Authorization', 'Bearer ' + validToken)
        .send({})
        .end((err, res) => {
          global.chai.expect(res, 'status code').to.have.status(500);
          global.chai.expect(res, 'response format').be.json;
          global.chai.expect(JSON.stringify(res.body), 'response body content').include('ParameterValidationError');
          done();
        });
    });
    */
  });
  