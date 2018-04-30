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
describe('Job execution type API /api/v1/jobs/:jobName/executionType', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  // Mock launcher webservice
  beforeEach(() => {
    let frameworkDetail = {
      'summarizedFrameworkInfo': {
        'executionType': 'START',
      },
      'aggregatedFrameworkStatus': {
        'frameworkStatus': {
          'name': 'test',
          'frameworkState': 'APPLICATION_RUNNING',
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
      })
      .get('/v1/Frameworks/test2')
      .reply(200, () => {
        frameworkDetail.aggregatedFrameworkStatus.frameworkStatus.name = 'test2';
        frameworkDetail.aggregatedFrameworkRequest.frameworkRequest.frameworkDescriptor.user.name = 'test2';
        return frameworkDetail;
      })
      .get('/v1/Frameworks/test3')
      .reply(200, () => {
        frameworkDetail.aggregatedFrameworkStatus.frameworkStatus.name = 'test3';
        return frameworkDetail;
      })
      .get('/v1/Frameworks/test1/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'iamadmin',
          },
        },
      })
      .get('/v1/Frameworks/test2/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'test2',
          },
        },
      })
      .put('/v1/Frameworks/test1/executionType', {
        'value': 'STOP',
      })
      .reply(200, null);
  });

  // PUT /api/v1/jobs/:jobName/executionType
  it('should stop job successfully', (done) => {
    chai.request(server)
      .put('/api/v1/jobs/test1/executionType')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImlhbWFkbWluIiwiYWRtaW4iOnRydWUsImlhdCI6MTUyMDU3OTg5OSwiZXhwIjoxNTUxNjgzODk5fQ.GniwMY_1L5n3crjV3u6G54KmaUv_OW5dHLwHlIt6IxE')
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
    chai.request(server)
      .put('/api/v1/jobs/test2/executionType')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImlhbWFkbWluIiwiYWRtaW4iOnRydWUsImlhdCI6MTUyMDU3OTg5OSwiZXhwIjoxNTUxNjgzODk5fQ.GniwMY_1L5n3crjV3u6G54KmaUv_OW5dHLwHlIt6IxE')
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
      .put('/api/v1/jobs/test3/executionType')
      .send({
        'value': 'STOP',
      })
      .end((err, res) => {
        expect(res, 'status code').to.have.status(401);
        expect(res, 'json response').be.json;
        expect(res.body.message, 'response message').equal('No authorization token was found');
        done();
      });
  });
});