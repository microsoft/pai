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
describe('Delete job: DELETE /api/v1/user/:username/jobs/:jobName', () => {
  const userToken = jwt.sign({username: 'test_user', admin: false}, process.env.JWT_SECRET, {expiresIn: 60});
  const adminToken = jwt.sign({username: 'test_admin', admin: true}, process.env.JWT_SECRET, {expiresIn: 60});

  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('[P-01] should delete job by admin', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_user~job')
      .reply(200, 
        mustache.render(frameworkDetailTemplate, {
          'frameworkName': 'job',
          'userName': 'test_user',
          'applicationId': 'app1',
        }
      ))
      .get('/v1/Frameworks/test_user~job/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'test_user',
          },
        },
      })
      .delete(`/v1/Frameworks/test_user~job`)
      .matchHeader('UserName', 'test_user')
      .reply(202);

    chai.request(server)
      .delete('/api/v1/user/test_user/jobs/job')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res).to.have.status(202);
        done();
      });
  });

  it('[P-02] should delete own job', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_user~job')
      .reply(200, 
        mustache.render(frameworkDetailTemplate, {
          'frameworkName': 'job',
          'userName': 'test',
          'applicationId': 'app1',
        }
      ))
      .get('/v1/Frameworks/test_user~job/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'test_user',
          },
        },
      })
      .delete(`/v1/Frameworks/test_user~job`)
      .matchHeader('UserName', 'test_user')
      .reply(202);

    chai.request(server)
      .delete('/api/v1/user/test_user/jobs/job')
      .set('Authorization', `Bearer ${userToken}`)
      .end((err, res) => {
        expect(res).to.have.status(202);
        done();
      });
  });

  it('[N-01] should forbid non-admin delete other\'s job', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_user~job')
      .reply(200, 
        mustache.render(frameworkDetailTemplate, {
          'frameworkName': 'job',
          'userName': 'test',
          'applicationId': 'app1',
        }
      ))
      .get('/v1/Frameworks/test_user~job/FrameworkRequest')
      .reply(200, {
        'frameworkDescriptor': {
          'user': {
            'name': 'test_admin',
          },
        },
      });

    chai.request(server)
      .delete('/api/v1/user/test_user/jobs/job')
      .set('Authorization', `Bearer ${userToken}`)
      .end((err, res) => {
        expect(res).to.have.status(403);
        expect(res.body.code).to.equal('ForbiddenUserError');
        done();
      });
  });

  it('[N-02] should forbid to delete not exist job.', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/test_user~job')
      .reply(404, {
        'exception': 'NotFoundException',
        'message': '',
        'javaClassName': '',
      });

    chai.request(server)
      .delete('/api/v1//user/test_user/jobs/job')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body.code).to.equal('NoJobError');
        done();
      });
  });
});

describe('Delete job: DELETE /api/v1/jobs/:jobName', () => {
  const userToken = jwt.sign({username: 'test_user', admin: false}, process.env.JWT_SECRET, {expiresIn: 60});
  const adminToken = jwt.sign({username: 'test_admin', admin: true}, process.env.JWT_SECRET, {expiresIn: 60});

  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('[N] should firbid delete job without namespace', (done) => {
    nock(launcherWebserviceUri)
      .get('/v1/Frameworks/job')
      .reply(200, 
        mustache.render(frameworkDetailTemplate, {
          'frameworkName': 'job',
          'userName': 'test',
          'applicationId': 'app1',
        }
      ))
    chai.request(server)
      .delete('/api/v1/jobs/job')
      .set('Authorization', `Bearer ${adminToken}`)
      .end((err, res) => {
        expect(res).to.have.status(403);
        expect(res.body.code).to.equal('ReadOnlyJobError');
        done();
      });
  });
});
