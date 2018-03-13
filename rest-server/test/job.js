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
describe('Jobs API /api/v1/jobs', () => {
  // Mock launcher webservice
  beforeEach(() => {
    nock(launcherWebserviceUri)
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
  });

  // GET /api/v1/jobs
  it('should return jobs list', (done) => {
    chai.request(server)
      .get('/api/v1/jobs')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res, 'json response').be.json;
        done();
      });
  });
});
