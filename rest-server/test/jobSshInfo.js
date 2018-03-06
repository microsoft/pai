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

describe('Get job SSH info: /api/v1/jobs/:jobName/ssh', () => {
  // Mock WebHDFS: List the folder of SSH info of a job
  beforeEach(() => {
    nock(webhdfsUri)
      .get('/webhdfs/v1/Container/test/job1/ssh/application_1519960554030_0043/?op=LISTSTATUS')
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
            ]
          }
        });

    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/job1')
      .reply(
        200,
        {
          'summarizedFrameworkInfo': {
            'frameworkName': 'job1',
          },
          'aggregatedFrameworkRequest': {
            'frameworkRequest': {
              'frameworkDescriptor': {
                'user': {
                  'name': 'test'
                }
              }
            }
          },
          'aggregatedFrameworkStatus': {
            'frameworkStatus': {
              'frameworkRetryPolicyState': {
                'retriedCount': 0,
                'transientNormalRetriedCount': 0,
                'transientConflictRetriedCount': 0,
                'nonTransientRetriedCount': 0,
                'unKnownRetriedCount': 0
              },
              'frameworkState': 'APPLICATION_RUNNING',
              'applicationId': 'application_1519960554030_0043',
            }
          },
        });
  });

  // GET /api/v1/jobs/:jobName/ssh
  it('should return job ssh info', (done) => {
    chai.request(server)
      .get('/api/v1/jobs/job1/ssh')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        done();
      });
  });
});
 