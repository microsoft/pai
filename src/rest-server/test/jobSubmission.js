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

describe('Submit job: POST /api/v1/user/:username/jobs', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
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

  const prepareNockForCaseP01 = (namespace, jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${namespace}~${jobName}`)
      .reply(
        404,
        {}
      );
    global.nock(global.launcherWebserviceUri)
      .put(`/v1/Frameworks/${namespace}~${jobName}`)
      .matchHeader('UserName', namespace)
      .reply(
        202,
        {}
      );
    global.nock(global.webhdfsUri)
      .put(/op=MKDIR/)
      .times(5)
      .reply(
        200,
        {}
      );

    // Add OS platform check
    // Since ssh-keygen package only works for Linux
    if (process.platform.toUpperCase() === 'LINUX') {
      global.nock(global.webhdfsUri)
      .put(/op=CREATE/)
      .times(6)
      .reply(
        201,
        {}
      );
    } else {
      global.nock(global.webhdfsUri)
      .put(/op=CREATE/)
      .times(4)
      .reply(
        201,
        {}
      );
    }
  };

  const prepareNockForCaseP02 = prepareNockForCaseP01;

  const prepareNockForCaseP03 = prepareNockForCaseP01;

  const prepareNockForCaseN03 = () => {
    global.nock(global.launcherWebserviceUri)
      .get('/v1/Frameworks/test~job1')
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
  };

  const prepareNockForCaseN05 = (namespace, jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${namespace}~${jobName}`)
      .reply(
        404,
        {}
      );

    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, {
        'scheduler': {
          'schedulerInfo': {
            'queues': {
              'queue': [
                {
                  'queueName': 'default',
                  'state': 'RUNNING',
                  'type': 'capacitySchedulerLeafQueueInfo',
                },
                {
                  'queueName': 'vc1',
                  'state': 'RUNNING',
                  'type': 'capacitySchedulerLeafQueueInfo',
                },
                {
                  'queueName': 'vc2',
                  'state': 'RUNNING',
                  'type': 'capacitySchedulerLeafQueueInfo',
                }
              ]
            },
            'type': 'capacityScheduler',
            'usedCapacity': 0.0
          }
        }
      });
  }

  const prepareNockForCaseN06 = (namespace, jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${namespace}~${jobName}`)
      .reply(
        404,
        {}
      );

    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, {
        'scheduler': {
          'schedulerInfo': {
            'queues': {
              'queue': [
                {
                  'queueName': 'default',
                  'state': 'RUNNING',
                  'type': 'capacitySchedulerLeafQueueInfo',
                },
                {
                  'queueName': 'vc1',
                  'state': 'RUNNING',
                  'type': 'capacitySchedulerLeafQueueInfo',
                },
                {
                  'queueName': 'vc2',
                  'state': 'RUNNING',
                  'type': 'capacitySchedulerLeafQueueInfo',
                }
              ]
            },
            'type': 'capacityScheduler',
            'usedCapacity': 0.0
          }
        }
      });

    //
    // Mock etcd return result
    //
    nock(global.etcdHosts)
      .get('/v2/keys/users/user1/virtualClusters')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/user1/virtualClusters',
          'value': 'default,vc1',
          'modifiedIndex': 246,
          'createdIndex': 246
        }
      });
  }

  const prepareNockForCaseN08 = (namespace, jobName) => {
      global.nock(global.launcherWebserviceUri)
        .get(`/v1/Frameworks/${namespace}~${jobName}`)
        .reply(
          404,
          {}
        );

      nock(yarnUri)
        .get('/ws/v1/cluster/scheduler')
        .reply(200, {
          'scheduler': {
            'schedulerInfo': {
              'queues': {
                'queue': [
                  {
                    'queueName': 'default',
                    'state': 'RUNNING',
                    'type': 'capacitySchedulerLeafQueueInfo',
                  },
                  {
                    'queueName': 'vc1',
                    'state': 'RUNNING',
                    'type': 'capacitySchedulerLeafQueueInfo',
                  },
                  {
                    'queueName': 'vc2',
                    'state': 'RUNNING',
                    'type': 'capacitySchedulerLeafQueueInfo',
                  }
                ]
              },
              'type': 'capacityScheduler',
              'usedCapacity': 0.0
            }
          }
        });

      //
      // Mock etcd return result
      //
      nock(global.etcdHosts)
        .get('/v2/keys/users/user1/virtualClusters')
        .reply(200, {
          'errorCode':100,
          'message':'Key not found',
          'cause':'/users/user1/virtualClusters',
          'index':51
        });
  }

  const prepareNockForCaseN09 = prepareNockForCaseN03;


  //
  // Positive cases
  //

  it('[P-01] Submit a job to the default vc', (done) => {
    prepareNockForCaseP01('user1', 'new_job');
    let jobConfig = global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job'});
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(jobConfig))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(202);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update job new_job successfully');
        done();
      });
  });

  it('[P-02] Submit a job to a valid virtual cluster', (done) => {
    prepareNockForCaseP02('user1', 'new_job_in_vc1');
    let jobConfig = global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_in_vc1'});
    jobConfig['virtualCluster'] = 'vc1';
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(jobConfig))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(202);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update job new_job_in_vc1 successfully');
        done();
      });
  });

  it('[P-03] Submit a job using PUT method', (done) => {
    prepareNockForCaseP03('user1', 'new_job');
    global.chai.request(global.server)
      .put('/api/v1/user/user1/jobs/new_job')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, { 'jobName': 'new_job' })))
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

  it('[N-01] Invalid token', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + invalidToken)
      .send({})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('UnauthorizedUserError');
        done();
      });
  });

  it('[N-02] Schema checking failed', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send({})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body, 'response body content').include({ code: 'InvalidParametersError' });
        done();
      });
  });

  it('[N-03] Duplicated job name', (done) => {
    prepareNockForCaseN03();
    global.chai.request(global.server)
      .post('/api/v1/user/test/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'job1'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(409);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(JSON.stringify(res.body.code), 'response error code').include('ConflictJobError');
        done();
      });
  });

  it('[N-04] Cannot connect to Launcher', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'another_new_job'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(JSON.stringify(res.body.code), 'response error code').include('UnknownError');
        done();
      });
  });


  it('[N-05] Failed to submit a job to non-exist virtual cluster.', (done) => {
    prepareNockForCaseN05('user1', 'new_job_queue_vc_non_exist');
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_queue_vc_non_exist', 'virtualCluster': 'non-exist-vc'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response error code').equal('NoVirtualClusterError');
        done();
      });
  });

  it('[N-06] Failed to submit a job to no access right virtual cluster.', (done) => {
    prepareNockForCaseN06('user1', 'new_job_vc_no_right');
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_vc_no_right', 'virtualCluster': 'vc2'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response error code').equal('ForbiddenUserError');
        done();
      });
  });

  it('[N-07] minFailedTaskCount or minSucceededTaskCount is greater than tasks number.', (done) => {
    const jobConfig = JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_minFailedTaskCount'}));
    jobConfig.taskRoles[0].minFailedTaskCount = 2;
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(jobConfig)
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('InvalidParametersError');
        done();
      });
  });

  it('[N-08] should submit job failed when db does not have vc field', (done) => {
    prepareNockForCaseN08('user1', 'new_job_vc_not_found');
    global.chai.request(global.server)
      .post('/api/v1/user/user1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_vc_not_found', 'virtualCluster': 'vc2'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response error code').equal('UnknownError');
        done();
      });
  });

  it('[N-09] Duplicated job name using PUT method', (done) => {
    prepareNockForCaseN09();
    global.chai.request(global.server)
      .put('/api/v1/user/test/jobs/job1')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'job1'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(409);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(JSON.stringify(res.body.code), 'response error code').include('ConflictJobError');
        done();
      });
  });

});

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

  //
  // Define functions to prepare nock interceptors
  //

  const prepareNockForCaseN02 = (jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${jobName}`)
      .reply(
        404,
        {}
      );
  };

  //
  // Negative cases
  //

  it('[N-01] POST without namespace', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/jobs')
      .set('Authorization', 'Bearer ' + validToken)
      .send({})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ReadOnlyJobError');
        done();
      });
  });

  it('[N-02] PUT without namespace', (done) => {
    prepareNockForCaseN02('job1');
    global.chai.request(global.server)
      .put('/api/v1/jobs/job1')
      .set('Authorization', 'Bearer ' + validToken)
      .send({})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body, 'response body content').include({ code: 'ReadOnlyJobError' });
        done();
      });
  });
});
