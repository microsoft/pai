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

// test
describe('Jobs API /api/v2/user/:username/jobs', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  //
  // Define data
  //

  const allFrameworks = {
    'summarizedFrameworkInfos': [
      {
        'frameworkName': 'test1~job1',
        'userName': 'test1',
        'frameworkState': 'FRAMEWORK_COMPLETED',
        'frameworkRetryPolicyState': {
          'succeededRetriedCount': 0,
          'transientNormalRetriedCount': 0,
          'transientConflictRetriedCount': 0,
          'nonTransientRetriedCount': 0,
          'unKnownRetriedCount': 0,
        },
        'firstRequestTimestamp': new Date().getTime() + 20,
        'frameworkCompletedTimestamp': new Date().getTime() + 20,
        'applicationExitCode': 0,
        'queue': 'vc1',
      },
      {
        'frameworkName': 'test1~job2',
        'userName': 'test1',
        'frameworkState': 'FRAMEWORK_COMPLETED',
        'frameworkRetryPolicyState': {
          'succeededRetriedCount': 0,
          'transientNormalRetriedCount': 1,
          'transientConflictRetriedCount': 2,
          'nonTransientRetriedCount': 3,
          'unKnownRetriedCount': 4,
        },
        'firstRequestTimestamp': new Date().getTime() + 10,
        'frameworkCompletedTimestamp': new Date().getTime() + 10,
        'applicationExitCode': 1,
        'queue': 'default',
      },
      // For legacy uses
      {
        'frameworkName': 'job3',
        'userName': 'test1',
        'frameworkState': 'FRAMEWORK_COMPLETED',
        'frameworkRetryPolicyState': {
          'succeededRetriedCount': 0,
          'transientNormalRetriedCount': 1,
          'transientConflictRetriedCount': 2,
          'nonTransientRetriedCount': 3,
          'unKnownRetriedCount': 4,
        },
        'firstRequestTimestamp': new Date().getTime(),
        'frameworkCompletedTimestamp': new Date().getTime(),
        'applicationExitCode': 1,
        'queue': 'default',
      },
    ],
  };

  // GET /api/v1/jobs
  it('[P-01] Get job list', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks')
      .query({UserName: 'test1'})
      .reply(
        200,
        allFrameworks
      );
    chai.request(server)
      .get('/api/v2/user/test1/jobs')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body.length, 'job list length').to.equal(3);
        expect(res.body[0].name, 'job name').to.equal('job1');
        expect(res.body[1].name, 'job name').to.equal('job2');
        expect(res.body[2].name, 'job name').to.equal('job3');
        expect(res.body[2].legacy, 'job legacy').to.equal(true);
        done();
      });
  });
});

describe('Jobs API /api/v1/jobs', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  //
  // Define data
  //

  const allFrameworks = {
    'summarizedFrameworkInfos': [
      {
        'frameworkName': 'job1',
        'userName': 'test1',
        'frameworkState': 'FRAMEWORK_COMPLETED',
        'frameworkRetryPolicyState': {
          'succeededRetriedCount': 0,
          'transientNormalRetriedCount': 0,
          'transientConflictRetriedCount': 0,
          'nonTransientRetriedCount': 0,
          'unKnownRetriedCount': 0,
        },
        'firstRequestTimestamp': new Date().getTime() + 20,
        'frameworkCompletedTimestamp': new Date().getTime() + 20,
        'applicationExitCode': 0,
        'queue': 'vc1',
      },
      {
        'frameworkName': 'job2',
        'userName': 'test2',
        'frameworkState': 'FRAMEWORK_COMPLETED',
        'frameworkRetryPolicyState': {
          'succeededRetriedCount': 0,
          'transientNormalRetriedCount': 1,
          'transientConflictRetriedCount': 2,
          'nonTransientRetriedCount': 3,
          'unKnownRetriedCount': 4,
        },
        'firstRequestTimestamp': new Date().getTime() + 10,
        'frameworkCompletedTimestamp': new Date().getTime() + 10,
        'applicationExitCode': 1,
        'queue': 'default',
      },
      {
        'frameworkName': 'test1~job3',
        'userName': 'test1',
        'frameworkState': 'FRAMEWORK_COMPLETED',
        'frameworkRetryPolicyState': {
          'succeededRetriedCount': 0,
          'transientNormalRetriedCount': 1,
          'transientConflictRetriedCount': 2,
          'nonTransientRetriedCount': 3,
          'unKnownRetriedCount': 4,
        },
        'firstRequestTimestamp': new Date().getTime(),
        'frameworkCompletedTimestamp': new Date().getTime(),
        'applicationExitCode': 1,
        'queue': 'default',
      },
    ],
  };

  // GET /api/v1/jobs
  it('[P-01] Get job list', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks')
      .reply(
        200,
        allFrameworks
      );
    chai.request(server)
      .get('/api/v1/jobs')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body[0].name, 'job name').to.equal('job1');
        expect(res.body[0].legacy, 'job legacy').to.equal(true);
        expect(res.body[1].name, 'job name').to.equal('job2');
        expect(res.body[1].legacy, 'job legacy').to.equal(true);
        expect(res.body[2].name, 'job name').to.equal('job3');
        done();
      });
  });

  it('[P-02] Get job list of user \'test1\'', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks')
      .query({UserName: 'test1'})
      .reply(
        200,
        {
          'summarizedFrameworkInfos': [
            allFrameworks.summarizedFrameworkInfos[0],
          ],
        }
      );
    chai.request(server)
      .get('/api/v1/jobs?username=test1')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body.length, 'test1 job list length').to.equal(1);
        done();
      });
  });
});
