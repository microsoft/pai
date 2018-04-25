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

describe('Get job SSH info: GET /api/v1/jobs/:jobName/ssh', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    //
    // Mock FrameworkLauncher
    //

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/job1')
      .reply(
        200,
        mustache.render(
          frameworkDetailTemplate,
          {
            'frameworkName': 'job1',
            'userName': 'test',
            'applicationId': 'app1',
          }
        )
      );

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/job2')
      .reply(
        404,
        {
          'exception': 'NotFoundException',
          'message': '',
          'javaClassName': '',
        }
      );

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/job3')
      .reply(
        200,
        mustache.render(
          frameworkDetailTemplate,
          {
            'frameworkName': 'job3',
            'userName': 'test',
            'applicationId': 'app3',
          }
        )
      );

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/job5')
      .reply(
        200,
        mustache.render(
          frameworkDetailTemplate,
          {
            'frameworkName': 'job5',
            'userName': 'test',
            'applicationId': 'app5',
          }
        )
      );

    //
    // Mock WebHDFS
    //

    nock(webhdfsUri)
      .get('/webhdfs/v1/Container/test/job1/ssh/app1?op=LISTSTATUS')
      .reply(
        200,
        {
          'FileStatuses': {
            'FileStatus': [
              {
                'pathSuffix': 'container_1519960554030_0043_01_000002-10.240.0.15-39035',
              },
              {
                'pathSuffix': 'container_1519960554030_0043_01_000003-10.240.0.17-28730',
              },
              {
                'pathSuffix': 'container_1519960554030_0043_01_000004-10.240.0.16-30690',
              },
            ],
          },
        }
      );

    nock(webhdfsUri)
      .get('/webhdfs/v1/Container/test/job3/ssh/app3?op=LISTSTATUS')
      .reply(
        404,
        {
          'RemoteException': {
            'exception': 'FileNotFoundException',
            'javaClassName': 'java.io.FileNotFoundException',
            'message': 'File not found.',
          },
        }
      );
  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): The job exists, and its SSH info exists too.', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/job1/ssh')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'response format').be.json;
        expect(JSON.stringify(res.body), 'response body content').include('keyPair');
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 2 (Negative): The job does not exist at all.', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/job2/ssh')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });

  it('Case 3 (Negative): The job exists, but does not contain SSH info.', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/job3/ssh')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        expect(res, 'json response').be.json;
        done();
      });
  });

  it('Case 4 (Negative): Cannot connect to Launcher.', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/job4/ssh')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res, 'json response').be.json;
        done();
      });
  });

  it('Case 5 (Negative): Cannot connect to WebHDFS.', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/job5/ssh')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(500);
        expect(res, 'json response').be.json;
        done();
      });
  });
});
 