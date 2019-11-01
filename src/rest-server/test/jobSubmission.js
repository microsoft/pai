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

const nockUtils = require('./utils/nock');

const schedulerResponse = {
  'scheduler': {
    'schedulerInfo': {
      'queues': {
        'queue': [
          {
            'queueName': 'default',
            'state': 'RUNNING',
            'type': 'capacitySchedulerLeafQueueInfo',
            'absoluteCapacity': 30.000002,
            'absoluteMaxCapacity': 100,
            'capacities': {
              'queueCapacitiesByPartition': [
                {
                  'partitionName': '',
                  'capacity': 30.000002,
                  'usedCapacity': 0,
                  'maxCapacity': 100,
                  'absoluteCapacity': 30.000002,
                  'absoluteUsedCapacity': 0,
                  'absoluteMaxCapacity': 100,
                  'maxAMLimitPercentage': 0,
                },
              ],
            },
            'resources': {
              'resourceUsagesByPartition': [
                {
                  'partitionName': '',
                  'used': {
                    'memory': 0,
                    'vCores': 0,
                    'GPUs': 0,
                  },
                },
              ],
            },
          },
          {
            'queueName': 'vc1',
            'state': 'RUNNING',
            'type': 'capacitySchedulerLeafQueueInfo',
            'capacity': 50.000002,
            'absoluteCapacity': 0,
            'absoluteMaxCapacity': 100,
            'capacities': {
              'queueCapacitiesByPartition': [
                {
                  'partitionName': '',
                  'capacity': 30.000002,
                  'usedCapacity': 0,
                  'maxCapacity': 100,
                  'absoluteCapacity': 30.000002,
                  'absoluteUsedCapacity': 0,
                  'absoluteMaxCapacity': 100,
                  'maxAMLimitPercentage': 0,
                },
              ],
            },
            'resources': {
              'resourceUsagesByPartition': [
                {
                  'partitionName': '',
                  'used': {
                    'memory': 0,
                    'vCores': 0,
                    'GPUs': 0,
                  },
                },
              ],
            },
          },
          {
            'queueName': 'vc2',
            'state': 'RUNNING',
            'type': 'capacitySchedulerLeafQueueInfo',
            'capacity': 19.999996,
            'absoluteCapacity': 0,
            'absoluteMaxCapacity': 100,
            'capacities': {
              'queueCapacitiesByPartition': [
                {
                  'partitionName': '',
                  'capacity': 30.000002,
                  'usedCapacity': 0,
                  'maxCapacity': 100,
                  'absoluteCapacity': 30.000002,
                  'absoluteUsedCapacity': 0,
                  'absoluteMaxCapacity': 100,
                  'maxAMLimitPercentage': 0,
                },
              ],
            },
            'resources': {
              'resourceUsagesByPartition': [
                {
                  'partitionName': '',
                  'used': {
                    'memory': 0,
                    'vCores': 0,
                    'GPUs': 0,
                  },
                },
              ],
            },
          },
        ],
      },
      'type': 'capacityScheduler',
      'usedCapacity': 0.0,
    },
  },
};

const nodeResponse = {
  'nodes': {
    'node': [
      {
        'rack': '/default-rack',
        'state': 'RUNNING',
        'id': '10.151.40.132:8041',
        'nodeHostName': '10.151.40.132',
        'nodeHTTPAddress': '10.151.40.132:8042',
        'numContainers': 2,
        'usedMemoryMB': 3072,
        'availMemoryMB': 205824,
        'usedVirtualCores': 2,
        'availableVirtualCores': 22,
        'usedGPUs': 1,
        'availableGPUs': 3,
        'availableGPUAttribute': 14,
        'nodeLabels': [
          'test_vc',
        ],
      },
      {
        'rack': '/default-rack',
        'state': 'RUNNING',
        'id': '10.151.40.131:8041',
        'nodeHostName': '10.151.40.131',
        'nodeHTTPAddress': '10.151.40.131:8042',
        'numContainers': 2,
        'usedMemoryMB': 3072,
        'availMemoryMB': 205824,
        'usedVirtualCores': 2,
        'availableVirtualCores': 22,
        'usedGPUs': 1,
        'availableGPUs': 3,
        'availableGPUAttribute': 14,
      },
    ],
  },
};

const user1Schema = {
  'kind': 'Secret',
  'apiVersion': 'v1',
  'metadata': {
    'name': '7573657231', // user1
  },
  'data': {
    'email': '',
    'extension': 'e30=', // {}
    'grouplist': 'WyJkZWZhdWx0IiwidmMxIl0=', // ["default","vc1"]
    'password': 'ZmE5NGU5MDE0ZWI1MmU4YTk3Mjg2ZjJmNjVhOWU1OTdlMjIyMTVjMmM1NmIzYjJhYmJhOWRmY2ZmZjJmZjM3MTgzM2ZkOTExYWFhZWM0YmI4N2VkYmI0YTc5NWQ3Nzk5OWNkMWI0MWY4MDg3ODQ4NmE3ZTIwYWJmOGM0YWQ1ODc=',
    'username': 'dXNlcjE=', // user1
  },
  'type': 'Opaque',
};

const defaultGroupSchema = {
  'kind': 'Secret',
  'apiVersion': 'v1',
  'metadata': {
    'name': '64656661756c74', // default
  },
  'data': {
    'groupname': 'ZGVmYXVsdA==', // default
    'description': 'dGVzdA==',
    'externalName': 'MTIzNA==',
    'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbImRlZmF1bHQiXX19', // {"acls":{"admin":false,"virtualClusters":["default"]}}
  },
  'type': 'Opaque',
};

const vc1GroupSchema = {
  'kind': 'Secret',
  'apiVersion': 'v1',
  'metadata': {
    'name': '766331', // vc1
  },
  'data': {
    'groupname': 'dmMx', // vc1
    'description': 'dGVzdA==',
    'externalName': 'MTIzNA==',
    'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbInZjMSJdfX0=', // {"acls":{"admin":false,"virtualClusters":["vc1"]}}
  },
  'type': 'Opaque',
};

describe('Submit job: POST /api/v2/user/:username/jobs', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

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
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${namespace}~${jobName}`)
      .reply(
        200,
        global.mustache.render(
          global.frameworkDetailTemplate,
          {
            'frameworkName': `${namespace}~${jobName}`,
            'username': namespace,
            'applicationId': 'app1',
          }
        )
      );
    global.nock(global.webhdfsUri)
      .put(/op=MKDIR/)
      .times(5)
      .reply(
        200,
        {}
      );
    //
    // Mock k8s secret return result
    //
    nock(global.apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7573657231')
      .reply(200, user1Schema)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .reply(200, vc1GroupSchema);

    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, schedulerResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, nodeResponse);

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

  const prepareNockForCaseP04 = (namespace, jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${namespace}~${jobName}`)
      .twice()
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

    //
    // Mock k8s secret return result
    //
    nock(global.apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7573657231')
      .reply(200, user1Schema)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .reply(200, vc1GroupSchema);

    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, schedulerResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, nodeResponse);
  };

  const prepareNockForCaseN03 = () => {
    global.nock(global.launcherWebserviceUri)
      .get('/v1/Frameworks/test~job1')
      .reply(
        200,
        global.mustache.render(
          global.frameworkDetailTemplate,
          {
            'frameworkName': 'job1',
            'username': 'test',
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
      .reply(200, schedulerResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, nodeResponse);
  };

  const prepareNockForCaseN06 = (namespace, jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${namespace}~${jobName}`)
      .reply(
        404,
        {}
      );

    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, schedulerResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, nodeResponse);

    //
    // Mock k8s secret return result
    //
    nock(global.apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7573657231')
      .reply(200, user1Schema)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .reply(200, vc1GroupSchema);
  };

  const prepareNockForCaseN08 = prepareNockForCaseN03;

  //
  // Positive cases
  //

  it('[P-01] Submit a job to the default vc', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseP01('user1', 'new_job');
    let jobConfig = global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job', 'virtualCluster': 'default'});
    global.chai.request(global.server)
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .set('Host', 'example.test')
      .send(JSON.parse(jobConfig))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'location header').to.have.header('location', 'http://example.test/api/v2/user/user1/jobs/new_job');
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.name, 'response job name').equal('new_job');
        done();
      });
  });

  it('[P-02] Submit a job to a valid virtual cluster', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseP02('user1', 'new_job_in_vc1');
    let jobConfig = global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_in_vc1', 'virtualCluster': 'vc1'});
    global.chai.request(global.server)
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .set('Host', 'example.test')
      .send(JSON.parse(jobConfig))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'location header').to.have.header('location', 'http://example.test/api/v2/user/user1/jobs/new_job_in_vc1');
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.name, 'response job name').equal('new_job_in_vc1');
        done();
      });
  });

  it('[P-03] Submit a job using PUT method', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseP03('user1', 'new_job');
    global.chai.request(global.server)
      .put('/api/v2/user/user1/jobs/new_job')
      .set('Authorization', 'Bearer ' + token)
      .set('Host', 'example.test')
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'location header').to.have.header('location', 'http://example.test/api/v2/user/user1/jobs/new_job');
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.name, 'response job name').equal('new_job');
        done();
      });
  });

  it('[P-04] Submit a job using PUT method, but not created in launcher on time', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseP04('user1', 'new_job');
    global.chai.request(global.server)
      .put('/api/v2/user/user1/jobs/new_job')
      .set('Authorization', 'Bearer ' + token)
      .set('Host', 'example.test')
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(202);
        global.chai.expect(res, 'location header').to.have.header('location', 'http://example.test/api/v2/user/user1/jobs/new_job');
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
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + 'invalidToken')
      .send({})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('UnauthorizedUserError');
        done();
      });
  });

  it('[N-02] Schema checking failed', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    global.chai.request(global.server)
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .send({})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body, 'response body content').include({code: 'InvalidParametersError'});
        done();
      });
  });

  it('[N-03] Duplicated job name', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseN03();
    global.chai.request(global.server)
      .post('/api/v2/user/test/jobs')
      .set('Authorization', 'Bearer ' + token)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'job1'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(409);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(JSON.stringify(res.body.code), 'response error code').include('ConflictJobError');
        done();
      });
  });

  it('[N-04] Cannot connect to Launcher', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    global.chai.request(global.server)
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'another_new_job'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(JSON.stringify(res.body.code), 'response error code').include('UnknownError');
        done();
      });
  });


  it('[N-05] Failed to submit a job to non-exist virtual cluster.', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseN05('user1', 'new_job_queue_vc_non_exist');
    global.chai.request(global.server)
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_queue_vc_non_exist', 'virtualCluster': 'non-exist-vc'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response error code').equal('NoVirtualClusterError');
        done();
      });
  });

  it('[N-06] Failed to submit a job to no access right virtual cluster.', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseN06('user1', 'new_job_vc_no_right');
    global.chai.request(global.server)
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .send(JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_vc_no_right', 'virtualCluster': 'vc2'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response error code').equal('ForbiddenUserError');
        done();
      });
  });

  it('[N-07] minFailedTaskCount or minSucceededTaskCount is greater than tasks number.', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    const jobConfig = JSON.parse(global.mustache.render(global.jobConfigTemplate, {'jobName': 'new_job_minFailedTaskCount'}));
    jobConfig.taskRoles[0].minFailedTaskCount = 2;
    global.chai.request(global.server)
      .post('/api/v2/user/user1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .send(jobConfig)
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('InvalidParametersError');
        done();
      });
  });

  it('[N-08] Duplicated job name using PUT method', (done) => {
    prepareNockForCaseN08();
    global.chai.request(global.server)
      .put('/api/v2/user/test/jobs/job1')
      .set('Authorization', 'Bearer ' + 'token') // API check job duplication before token
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
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  //
  // Define functions to prepare nock interceptors
  //

  const prepareNockForCaseP01 = (jobName) => {
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${jobName}`)
      .reply(
        404,
        {}
      );
    global.nock(global.launcherWebserviceUri)
      .put(`/v1/Frameworks/${jobName}`)
      .reply(
        202,
        {}
      );
    global.nock(global.launcherWebserviceUri)
      .get(`/v1/Frameworks/${jobName}`)
      .reply(
        200,
        global.mustache.render(
          global.frameworkDetailTemplate,
          {
            'frameworkName': `${jobName}`,
            'username': 'user1',
            'applicationId': 'app1',
          }
        )
      );
    global.nock(global.webhdfsUri)
      .put(/op=MKDIR/)
      .times(5)
      .reply(
        200,
        {}
      );
    //
    // Mock k8s secret return result
    //
    nock(global.apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7573657231')
      .reply(200, user1Schema)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .reply(200, vc1GroupSchema);

    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, schedulerResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, nodeResponse);

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

  //
  // Positive cases
  //

  it('[P-01] POST without namespace', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseP01('job1');
    let jobConfig = global.mustache.render(global.jobConfigTemplate, {'jobName': 'job1'});
    global.chai.request(global.server)
      .post('/api/v1/jobs')
      .set('Authorization', 'Bearer ' + token)
      .set('Host', 'example.test')
      .send(JSON.parse(jobConfig))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'location header').to.have.header('location', 'http://example.test/api/v1/jobs/job1');
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.name, 'response job name').equal('job1');
        done();
      });
  });

  it('[P-02] PUT without namespace', (done) => {
    const token = nockUtils.registerUserTokenCheck('user1');
    prepareNockForCaseP02('job2');
    let jobConfig = global.mustache.render(global.jobConfigTemplate, {'jobName': 'job2'});
    global.chai.request(global.server)
      .put('/api/v1/jobs/job2')
      .set('Authorization', 'Bearer ' + token)
      .set('Host', 'example.test')
      .send(JSON.parse(jobConfig))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'location header').to.have.header('location', 'http://example.test/api/v1/jobs/job2');
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.name, 'response job name').equal('job2');
        done();
      });
  });
});
