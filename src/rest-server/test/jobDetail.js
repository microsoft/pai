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

// test
describe('JobDetail API /api/v1/user/:username/jobs/:jobName', () => {
  after(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  // Mock launcher webservice
  before(() => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test~test_job')
      .reply(200, mustache.render(
        frameworkDetailTemplate,
        {
          'frameworkName': 'test~test_job',
          'userName': 'test',
          'queueName': 'vc3',
          'applicationId': 'test_job',
        }
      ));

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test~test_job2')
      .reply(404, {
        'error': 'JobNotFound',
        'message': 'could not find job test_job2',
      });

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test~test_job3')
      .reply(
        404,
        {
          'exception': 'NotFoundException',
          'message': '',
          'javaClassName': '',
        }
      );
  });

  //
  // Positive cases
  //

  it('[P-01] Should return test_job detail info', (done) => {
    chai.request(server)
      .get('/api/v1/user/test/jobs/test_job')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('name', 'test_job');
        expect(res.body).to.nested.include({ 'jobStatus.virtualCluster': 'vc3' });
        done();
      });
  });

  //
  // Negative cases
  //

  it('[N-01] Job does not exist should return error', (done) => {
    chai.request(server)
      .get('/api/v1/user/test/jobs/test_job2')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });

  it('[N-02] Cannot connect to Launcher', (done) => {
    chai.request(server)
      .get('/api/v1/user/test/jobs/test_job3')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });

});

describe('JobDetail API /api/v1/jobs/:jobName', () => {
  after(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  // Mock launcher webservice
  before(() => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_job')
      .reply(200, mustache.render(
        frameworkDetailTemplate,
        {
          'frameworkName': 'test_job',
          'userName': 'test',
          'queueName': 'vc3',
          'applicationId': 'test_job',
        }
      ));

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_job2')
      .reply(404, {
        'error': 'JobNotFound',
        'message': 'could not find job test_job2'
      });

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_job3')
      .reply(
        404,
        {
          'exception': 'NotFoundException',
          'message': '',
          'javaClassName': '',
        }
      );
  });

  //
  // Positive cases
  //

  it('[P-01] Should return test_job detail info', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/test_job')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        expect(res.body).to.have.property('name', 'test_job');
        expect(res.body).to.nested.include({
          'jobStatus.virtualCluster': 'vc3',
          'taskRoles.role1.taskStatuses.0.containerExitCode': 1,
        });
        done();
      });
  });

  //
  // Negative cases
  //

  it('[N-01] Job does not exist should return error', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/test_job2')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });

  it('[N-02] Cannot connect to Launcher', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/test_job3')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });

});
