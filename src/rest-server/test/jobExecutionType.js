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

const nockUtils = require('./utils/nock');

// test
describe('Job execution type API /api/v2/user/:username/jobs/:jobName/executionType', () => {
  after(function() {
    if (!nock.isDone()) {
      // TODO: Split mocks into each cases and enable the following error with afterEach.
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  // Mock launcher webservice
  before(() => {
    let frameworkDetail = {
      'summarizedFrameworkInfo': {
        'executionType': 'START',
      },
      'aggregatedFrameworkStatus': {
        'frameworkStatus': {
          'name': 'test',
          'frameworkState': 'APPLICATION_RUNNING',
          'frameworkRetryPolicyState': {
            'succeededRetriedCount': 0,
            'transientNormalRetriedCount': 0,
            'transientConflictRetriedCount': 0,
            'nonTransientRetriedCount': 0,
            'unKnownRetriedCount': 0,
          },
          'firstRequestTimestamp': new Date().getTime(),
          'frameworkCompletedTimestamp': new Date().getTime(),
          'applicationExitCode': 0,
        },
      },
      'aggregatedFrameworkRequest': {
        'frameworkRequest': {
          'frameworkDescriptor': {
            'user': {
              'name': 'iamadmin',
            },
          },
        },
      },
    };

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/iamadmin~test1')
      .twice()
      .reply(200, () => {
        frameworkDetail.aggregatedFrameworkStatus.frameworkStatus.name = 'test1';
        return frameworkDetail;
      })
      .get('/v1/Frameworks/test2~test2')
      .reply(200, () => {
        frameworkDetail.aggregatedFrameworkStatus.frameworkStatus.name = 'test2';
        frameworkDetail.aggregatedFrameworkRequest.frameworkRequest.frameworkDescriptor.user.name = 'test2';
        return frameworkDetail;
      })
      .get('/v1/Frameworks/iamadmin~test3')
      .reply(200, () => {
        frameworkDetail.aggregatedFrameworkStatus.frameworkStatus.name = 'test3';
        return frameworkDetail;
      })
      .get('/v1/Frameworks/iamadmin~test1/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'iamadmin',
          },
        },
      })
      .get('/v1/Frameworks/test2~test2/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'test2',
          },
        },
      })
      .put('/v1/Frameworks/iamadmin~test1/ExecutionType', {
        'executionType': 'STOP',
      })
      .reply(202, null)
      .put('/v1/Frameworks/test2~test2/ExecutionType', {
        'executionType': 'STOP',
      })
      .reply(202, null);
  });

  // PUT /api/v1/jobs/:jobName/executionType
  it('should stop job successfully', (done) => {
    const token = nockUtils.registerAdminTokenCheck('iamadmin');

    chai.request(server)
      .put('/api/v2/user/iamadmin/jobs/test1/executionType')
      .set('Authorization', `Bearer ${token}`)
      .send({
        'value': 'STOP',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(202);
        expect(res, 'json response').be.json;
        expect(res.body.message, 'response message').equal('execute job test1 successfully');
        done();
      });
  });

  it('admin should stop other user\'s job successfully', (done) => {
    const token = nockUtils.registerAdminTokenCheck('iamadmin');

    chai.request(server)
      .put('/api/v2/user/test2/jobs/test2/executionType')
      .set('Authorization', `Bearer ${token}`)
      .send({
        'value': 'STOP',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(202);
        expect(res, 'json response').be.json;
        expect(res.body.message, 'response message').equal('execute job test2 successfully');
        done();
      });
  });

  it('should not stop job without authorization', (done) => {
    chai.request(server)
      .put('/api/v2/user/iamadmin/jobs/test3/executionType')
      .send({
        'value': 'STOP',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(401);
        expect(res, 'json response').be.json;
        expect(res.body.code, 'response code').equal('UnauthorizedUserError');
        done();
      });
  });

  it('#909: should check request payload', (done) => {
    chai.request(server)
      .put('/api/v2/user/iamadmin/jobs/test1/executionType')
      .set('Authorization', 'Bearer token') // API will check payload schema before token.
      .set('Content-Type', 'text/unknown')
      .send('value=STOP')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(400);
        done();
      });
  });
});

describe('Job execution type API /api/v1/jobs/:jobName/executionType', () => {
  after(function() {
    if (!nock.isDone()) {
      // TODO: Split mocks into each cases and enable the following error with afterEach.
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  // Mock launcher webservice
  before(() => {
    let frameworkDetail = {
      'summarizedFrameworkInfo': {
        'executionType': 'START',
      },
      'aggregatedFrameworkStatus': {
        'frameworkStatus': {
          'name': 'test',
          'frameworkState': 'APPLICATION_RUNNING',
          'frameworkRetryPolicyState': {
            'succeededRetriedCount': 0,
            'transientNormalRetriedCount': 0,
            'transientConflictRetriedCount': 0,
            'nonTransientRetriedCount': 0,
            'unKnownRetriedCount': 0,
          },
          'firstRequestTimestamp': new Date().getTime(),
          'frameworkCompletedTimestamp': new Date().getTime(),
          'applicationExitCode': 0,
        },
      },
      'aggregatedFrameworkRequest': {
        'frameworkRequest': {
          'frameworkDescriptor': {
            'user': {
              'name': 'iamadmin',
            },
          },
        },
      },
    };

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test1')
      .reply(200, () => {
        frameworkDetail.aggregatedFrameworkStatus.frameworkStatus.name = 'test1';
        return frameworkDetail;
      });

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test1/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'iamadmin',
          },
        },
      });

    nock(launcherWebserviceUri)
      .put('/v1/Frameworks/test1/ExecutionType', {
        'executionType': 'STOP',
      })
      .reply(202, null);
  });

  // PUT /api/v1/jobs/:jobName/executionType
  it('can stop job without namespace', (done) => {
    const token = nockUtils.registerAdminTokenCheck('iamadmin');
    chai.request(server)
      .put('/api/v1/jobs/test1/executionType')
      .set('Authorization', `Bearer ${token}`)
      .send({
        'value': 'STOP',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(202);
        done();
      });
  });
});
