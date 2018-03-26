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

describe('Submit job: POST /api/v1/jobs', () => {
  beforeEach(() => {

    //
    // Mock launcher webservice
    //

    global.nock(global.launcherWebserviceUri)
      .get('/v1/Frameworks/job1')
      .reply(
        200,
        global.mustache.render(
          global.frameworkDetailTemplate,
          {
            'frameworkName': 'job1',
            'userName': 'test',
            'applicationId': 'app1',
          }
        )
      );

    global.nock(global.launcherWebserviceUri)
      .get('/v1/Frameworks')
      .reply(200, {
        'summarizedFrameworkInfos': [
          {
            'name': 'job1',
            'username': 'test',
            'frameworkState': 'FRAMEWORK_COMPLETED',
            'frameworkRetryPolicyState': {
              'transientNormalRetriedCount': 0,
              'transientConflictRetriedCount': 0,
              'nonTransientRetriedCount': 0,
              'unKnownRetriedCount': 0,
            },
            'firstRequestTimestamp': new Date().getTime(),
            'frameworkCompletedTimestamp': new Date().getTime(),
            'applicationExitCode': 0,
          },
          {
            'name': 'job2',
            'username': 'test',
            'frameworkState': 'FRAMEWORK_COMPLETED',
            'frameworkRetryPolicyState': {
              'transientNormalRetriedCount': 1,
              'transientConflictRetriedCount': 2,
              'nonTransientRetriedCount': 3,
              'unKnownRetriedCount': 4,
            },
            'firstRequestTimestamp': new Date().getTime(),
            'frameworkCompletedTimestamp': new Date().getTime(),
            'applicationExitCode': 1,
          },
        ],
      });

    global.nock(global.launcherWebserviceUri)
      .get('/v1/Frameworks/new_job')
      .reply(404, {});
  });

  //
  // Get a valid token that expires in 60 seconds.
  //

  const validToken = global.jwt.sign({username: 'user1', admin: false}, process.env.JWT_SECRET, {expiresIn: 60});
  const invalidToken = '';

  //
  // Positive cases
  //

  it('Case 1 (Positive): Submit a job.', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job'})))
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

  it('Case 1 (Negative): Invalid token.', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/jobs')
      .set('Authorization', 'Bearer ' + invalidToken)
      .send({})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('No authorization token was found');
        done();
      });
  });

  it('Case 2 (Negative): Schema checking failed.', (done) => {
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

  it('Case 3 (Negative): Duplicated job name.', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'job1'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(JSON.stringify(res.body), 'response body content').include('DuplicateJobSubmission');
        done();
      });
  });

  it('Case 4 (Negative): Cannot connect to Launcher.', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'another_new_job'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(JSON.stringify(res.body), 'response body content').include('InternalServerError');
        done();
      });
  });
});
