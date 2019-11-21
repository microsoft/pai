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

const nockUtils = require('./utils/nock');

/* const deleteUserTemplate = JSON.stringify({
  'username': '{{username}}',
}); */

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
                        'capacity': 50.000002,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 50.000002,
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
                        'capacity': 19.999996,
                        'usedCapacity': 0,
                        'maxCapacity': 100,
                        'absoluteCapacity': 19.999996,
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

const groupResponse = {
  'kind': 'SecretList',
  'apiVersion': 'v1',
  'metadata': {
    'selfLink': '/api/v1/namespaces/pai-group/secrets/',
    'resourceVersion': '1062682',
  },
  'items': [
    {
      'metadata': {
        'name': 'cantest001',
      },
      'data': {
        'groupname': 'ZGVmYXVsdA==',
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbImRlZmF1bHQiXX19', // {"acls":{"admin":false,"virtualClusters":["default"]}}
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test',
      },
      'data': {
        'groupname': 'dmMx',
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbInZjMSJdfX0=', // {"acls":{"admin":false,"virtualClusters":["vc1"]}}
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test_1',
      },
      'data': {
        'groupname': 'dmMy',
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbInZjMiJdfX0=', // {"acls":{"admin":false,"virtualClusters":["vc2"]}}
      },
      'type': 'Opaque',
    },
    {
      'metadata': {
        'name': 'pai_test_2',
      },
      'data': {
        'groupname': 'YWRtaW5Hcm91cA==', // adminGroup
        'description': 'dGVzdA==',
        'externalName': 'MTIzNA==',
        'extension': 'eyJhY2xzIjp7ImFkbWluIjp0cnVlLCJ2aXJ0dWFsQ2x1c3RlcnMiOlsiZGVmYXVsdCIsInZjMSIsInZjMiJdfX0=', // {"acls":{"admin":true,"virtualClusters":["default","vc1","vc2"]}}
      },
      'type': 'Opaque',
    },
  ],
};

const defaultGroupSchema = {
  'kind': 'Secret',
  'apiVersion': 'v1',
  'metadata': {
    'name': 'cantest001',
  },
  'data': {
    'groupname': 'ZGVmYXVsdA==',
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
    'name': 'pai_test',
  },
  'data': {
    'groupname': 'dmMx',
    'description': 'dGVzdA==',
    'externalName': 'MTIzNA==',
    'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbInZjMSJdfX0=', // {"acls":{"admin":false,"virtualClusters":["vc1"]}}
  },
  'type': 'Opaque',
};

const vc2GroupSchema = {
  'kind': 'Secret',
  'apiVersion': 'v1',
  'metadata': {
    'name': 'pai_test_1',
  },
  'data': {
    'groupname': 'dmMy',
    'description': 'dGVzdA==',
    'externalName': 'MTIzNA==',
    'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbInZjMiJdfX0=', // {"acls":{"admin":false,"virtualClusters":["vc2"]}}
  },
  'type': 'Opaque',
};

const adminGroupSchema = {
  'kind': 'Secret',
  'apiVersion': 'v1',
  'metadata': {
    'name': 'pai_test_2',
  },
  'data': {
    'groupname': 'YWRtaW5Hcm91cA==', // adminGroup
    'description': 'dGVzdA==',
    'externalName': 'MTIzNA==',
    'extension': 'eyJhY2xzIjp7ImFkbWluIjp0cnVlLCJ2aXJ0dWFsQ2x1c3RlcnMiOlsiZGVmYXVsdCIsInZjMSIsInZjMiJdfX0=', // {"acls":{"admin":true,"virtualClusters":["default","vc1","vc2"]}}
  },
  'type': 'Opaque',
};

//
// Get a valid token that expires in 60 seconds.
//


describe('Add new user: post /api/v2/user', () => {
  after(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  before(() => {
    // mock for case1 username=newuser

    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user-v2/secrets', {
        'metadata': {'name': '6e657775736572'},
        'data': {
          'password': 'MDkxZjc0YzZjNTYyOWExZTlmN2Y3N2ZlMjc1Mjk1NmNkYmQ4ZmNlMjRlZmM4NmUxODJlMzQ5ZmI3MzJhMjRkNTU5ZmQ5NWExYzVjZjZiNzNhZWQzNjA3ZDcxYmU3YjA0ZDMyZjcwNTJjMzdlMTEwNTUzMDliNWIwMjczNmFjNDE=',
          'username': 'bmV3dXNlcg==',
          'email': 'dGVzdEBwYWkuY29t',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIiwiYWRtaW5Hcm91cCJd', // ["default","vc1","vc2","adminGroup"]
          'extension': 'e30=',
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '6e657775736572',
            'namespace': 'pai-user',
            'selfLink': '/api/v1/namespaces/pai-user-v2/secrets/6e657775736572',
            'uid': 'f75b6065-f9c7-11e8-b564-000d3ab5296b',
            'resourceVersion': '1116114',
            'creationTimestamp': '2018-12-07T02:29:47Z',
        },
        'data': {
          'password': 'MDkxZjc0YzZjNTYyOWExZTlmN2Y3N2ZlMjc1Mjk1NmNkYmQ4ZmNlMjRlZmM4NmUxODJlMzQ5ZmI3MzJhMjRkNTU5ZmQ5NWExYzVjZjZiNzNhZWQzNjA3ZDcxYmU3YjA0ZDMyZjcwNTJjMzdlMTEwNTUzMDliNWIwMjczNmFjNDE=',
          'username': 'bmV3dXNlcg==',
          'email': 'dGVzdEBwYWkuY29t',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIiwiYWRtaW5Hcm91cCJd', // ["default","vc1","vc2","adminGroup"]
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    // mock for case2 add non-admin user

    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user-v2/secrets', {
        'metadata': {'name': '6e6f6e5f61646d696e'},
        'data': {
          'username': 'bm9uX2FkbWlu',
          'password': 'ZmFmZTk5ZGZlOWQzNzZlOTllYzFkMjlmN2ZlZWZhNmViYjZkYWYwM2RkYWYyNmRlNTdiMWFlYWIyNzU2ZGNiN2FjYTk5Y2Y1Y2E4YjQ1ZGM5OWI3YjM5NTE5ZGM3YjZlMzZmODlhOTY0NzUyNTZkOWE5MTdlZTQxMTc4ZGEzZGI=',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=', // ["default","vc1","vc2"]
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '6e6f6e5f61646d696e',
            'namespace': 'pai-user',
            'selfLink': '/api/v1/namespaces/pai-user-v2/secrets/6e6f6e5f61646d696e',
            'uid': 'f75b6065-f9c7-11e8-b564-000d3ab5296b',
            'resourceVersion': '1116114',
            'creationTimestamp': '2018-12-07T02:29:47Z',
        },
        'data': {
          'username': 'bm9uX2FkbWlu',
          'password': 'ZmFmZTk5ZGZlOWQzNzZlOTllYzFkMjlmN2ZlZWZhNmViYjZkYWYwM2RkYWYyNmRlNTdiMWFlYWIyNzU2ZGNiN2FjYTk5Y2Y1Y2E4YjQ1ZGM5OWI3YjM5NTE5ZGM3YjZlMzZmODlhOTY0NzUyNTZkOWE5MTdlZTQxMTc4ZGEzZGI=',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=', // ["default","vc1","vc2"]
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });


    // mock for case4 username=existuser.
    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user-v2/secrets', {
        'metadata': {'name': '657869737475736572'},
        'data': {
          'username': 'ZXhpc3R1c2Vy',
          'password': 'NGY3YzdlMDBlNzU3YzUzZjYwOTI1YTE5OWVlOTZjODMxMjlmMzgwYjRjMmQ2NzA5OWM3OThhNDg2ZjQ2ZGY4NjlmZjMxYWVkODZiOTg2NGIyMTI2OWZkYmM2YTkzMjNiZDY5MWZhNGZkN2JjZTAyNWE0M2ZlZGM5N2I2NWU0ZjQ=',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
      })
      .reply(409, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'657869737475736572\' already exists',
        'reason': 'AlreadyExists',
        'details': {
          'name': '657869737475736572',
          'kind': 'secrets',
        },
        'code': 409,
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .times(4)
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .times(4)
      .reply(200, vc1GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766332')
      .times(4)
      .reply(200, vc2GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/61646d696e47726f7570');
});

  //
  // Positive cases
  //

  it('Case 1 (Positive): Add admin user', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');

    global.chai.request(global.server)
      .post('/api/v2/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
          'username': 'newuser',
          'password': '123456',
          'email': 'test@pai.com',
          'virtualCluster': ['default', 'vc1', 'vc2'],
          'admin': true,
        })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('User is created successfully');
        done();
      });
  });

  it('Case 2 (Positive): Add non_admin user', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .post('/api/v2/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
        'username': 'non_admin',
        'password': '123456',
        'email': 'test@pai.com',
        'virtualCluster': ['default', 'vc1', 'vc2'],
        'admin': false,
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('User is created successfully');
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 3 (Negative): Should fail to add user with non-admin token.', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('userX');
    global.chai.request(global.server)
      .post('/api/v2/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send({
        'username': 'test_user',
        'password': '123456',
        'email': 'test@pai.com',
        'virtualCluster': ['default', 'vc1', 'vc2'],
        'admin': false,
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

  it('Case 4 (Negative): Should fail to add user with exist name.', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .post('/api/v2/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
        'username': 'existuser',
        'password': '123456',
        'email': 'test@pai.com',
        'virtualCluster': ['default', 'vc1', 'vc2'],
        'admin': false,
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(409);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ConflictUserError');
        done();
      });
  });
});

describe('update user: put /api/v2/user', () => {
  after(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  before(() => {
    // mock for case1 username=update_user.
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7570646174655f75736572')
      .times(2)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '7570646174655f75736572',
        },
        'data': {
            'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
            'username': 'dXBkYXRlX3VzZXI=',
            'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIiwiYWRtaW5Hcm91cCJd', // ["default","vc1","vc2","adminGroup"]
            'email': 'dGVzdEBwYWkuY29t',
            'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMxIiwidmMyIl19',
        },
        'type': 'Opaque',
    });

    nock(apiServerRootUri)
    .put('/api/v1/namespaces/pai-user-v2/secrets/7570646174655f75736572', {
      'metadata': {'name': '7570646174655f75736572'},
      'data': {
        'password': 'NWU4ZjY5N2FkNzkxOGQ3NTdlN2MyMWM4OTdiYjRmY2NhYTViYTFmM2VjZDExZDNlNjFjNmRiN2UxNDEwZjRkOWFlNDc0NWFjY2I5NzYyMmVhZDZlMzhmOTFjMzI4MTU0YWY4MzgwOThmNTc5NmMzZGU4MWZlN2Y2YzE0YjgxN2I=',
        'username': 'dXBkYXRlX3VzZXI=',
        'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIiwiYWRtaW5Hcm91cCJd', // ["default","vc1","vc2","adminGroup"]
        'email': 'dGVzdEBwYWkuY29t',
        'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMxIiwidmMyIl19',
       },
     })
    .reply(200, {
      'kind': 'Secret',
      'apiVersion': 'v1',
      'metadata': {
          'name': 'updateuser',
          'namespace': 'pai-user',
          'selfLink': '/api/v1/namespaces/pai-user-v2/secrets/7570646174655f75736572',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z',
      },
      'data': {
        'password': 'NWU4ZjY5N2FkNzkxOGQ3NTdlN2MyMWM4OTdiYjRmY2NhYTViYTFmM2VjZDExZDNlNjFjNmRiN2UxNDEwZjRkOWFlNDc0NWFjY2I5NzYyMmVhZDZlMzhmOTFjMzI4MTU0YWY4MzgwOThmNTc5NmMzZGU4MWZlN2Y2YzE0YjgxN2I=',
        'username': 'dXBkYXRlX3VzZXI=',
        'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIiwiYWRtaW5Hcm91cCJd', // ["default","vc1","vc2","adminGroup"]
        'email': 'dGVzdEBwYWkuY29t',
        'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMxIiwidmMyIl19',
      },
      'type': 'Opaque',
    });

    // mock for case2 username=update_user.
    nock(apiServerRootUri)
    .put('/api/v1/namespaces/pai-user-v2/secrets/7570646174655f75736572', {
      'metadata': {'name': '7570646174655f75736572'},
      'data': {
         'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
         'username': 'dXBkYXRlX3VzZXI=',
         'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=', // ["default","vc1","vc2"]
         'email': 'dGVzdEBwYWkuY29t',
         'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMxIiwidmMyIl19',
       },
     })
    .reply(200, {
      'kind': 'Secret',
      'apiVersion': 'v1',
      'metadata': {
          'name': '7570646174655f75736572',
          'namespace': 'pai-user',
          'selfLink': '/api/v1/namespaces/pai-user-v2/secrets/7570646174655f75736572',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z',
      },
      'data': {
        'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
        'username': 'dXBkYXRlX3VzZXI=',
        'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=', // ["default","vc1","vc2"]
        'email': 'dGVzdEBwYWkuY29t',
        'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMxIiwidmMyIl19',
      },
      'type': 'Opaque',
    });

    // mock for case3 username=non_exist_user.
    nock(apiServerRootUri)
    .get('/api/v1/namespaces/pai-user-v2/secrets/6e6f6e5f65786973745f75736572')
    .reply(404, {
      'kind': 'Status',
      'apiVersion': 'v1',
      'metadata': {},
      'status': 'Failure',
      'message': 'secrets \'6e6f6e5f65786973745f75736572\' not found',
      'reason': 'NotFound',
      'details': {
          'name': '6e6f6e5f65786973745f75736572',
          'kind': 'secrets',
      },
      'code': 404,
    });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .reply(200, vc1GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766332')
      .reply(200, vc2GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/61646d696e47726f7570')
      .reply(200, adminGroupSchema);
  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): Update user password.', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/update_user/password')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
        'newPassword': 'abcdef',
        'oldPassword': 'test12345',
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user password successfully.');
        done();
      });
  });

  it('Case 2 (Positive): Update user set admin=false.', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/update_user/admin')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
        'admin': false,
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Update user admin permission successfully.');
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 3 (Negative): Should fail to modify a non-exist user.', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/non_exist_user/password')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
        'newPassword': 'abcdef',
        'oldPassword': 'test12345',
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });

  it('Case 4 (Negative): Should trigger validation error if password sets null.', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/new_user/password')
      .set('Authorization', 'Bearer ' + validToken)
      .send({
        'oldPassword': 'test12345',
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        done();
      });
  });

  it('Case 5 (Negative): Should fail to update user with non-admin token.', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('userX');
    global.chai.request(global.server)
      .put('/api/v2/user/new_user/admin')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send({
        'admin': false,
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });
});

describe('delete user : delete /api/v2/user', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    // mock for case1 username=non_admin.
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/6e6f6e5f61646d696e')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '6e6f6e5f61646d696e',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'bm9uX2FkbWlu',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMxIiwidmMyIl19',
        },
        'type': 'Opaque',
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets')
      .times(1)
      .reply(200, groupResponse);

    nock(apiServerRootUri)
      .delete('/api/v1/namespaces/pai-user-v2/secrets/6e6f6e5f61646d696e')
      .reply(200, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Success',
        'details': {
          'name': '6e6f6e5f61646d696e',
          'kind': 'secrets',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
        },
      });

    // mock for case2 username=admin.
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/61646d696e')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'paitest',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'YWRtaW4=',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIiwiYWRtaW5Hcm91cCJd',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'eyJ2aXJ0dWFsQ2x1c3RlciI6WyJkZWZhdWx0IiwidmMxIiwidmMyIl19',
        },
        'type': 'Opaque',
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .reply(200, vc1GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766332')
      .reply(200, vc2GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/61646d696e47726f7570')
      .reply(200, adminGroupSchema);

    // mock for case3 username=non_exist.
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/6e6f6e6578697374')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'6e6f6e6578697374\' not found',
        'reason': 'NotFound',
        'details': {
            'name': 'nonexist',
            'kind': 'secrets',
        },
        'code': 404,
      });
  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): delete exist non_admin user', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .delete('/api/v2/user/non_admin')
      .set('Authorization', 'Bearer ' + validToken)
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        done();
      });
  });


  // Negative cases


  it('Case 2 (Negative): Should fail to delete admin user', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .delete('/api/v2/user/admin')
      .set('Authorization', 'Bearer ' + validToken)
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('RemoveAdminError');
        done();
      });
  });

  it('Case 3 (Negative): Should fail to delete non-exist user.', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .delete('/api/v2/user/nonexist')
      .set('Authorization', 'Bearer ' + validToken)
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });

  it('Case 4 (Negative): Should fail to delete user with non-admin token.', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('userX');
    global.chai.request(global.server)
      .delete('/api/v2/user/delete_non_admin_user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        done();
      });
  });
});

describe('update user virtual cluster : put /api/v2/user/:username/virtualClusters', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    nock(yarnUri)
      .get('/ws/v1/cluster/scheduler')
      .reply(200, schedulerResponse)
      .get('/ws/v1/cluster/nodes')
      .reply(200, nodeResponse);

    // mock for case1 username=test
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/74657374')
      .times(2)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '74657374',
        },
        'data': {
            'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
            'username': 'dGVzdA==',
            'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=',
            'email': 'dGVzdEBwYWkuY29t',
            'extension': 'e30=',
        },
        'type': 'Opaque',
    });

    nock(apiServerRootUri)
    .put('/api/v1/namespaces/pai-user-v2/secrets/74657374', {
      'metadata': {'name': '74657374'},
      'data': {
         'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
         'username': 'dGVzdA==',
         'grouplist': 'WyJkZWZhdWx0IiwidmMxIl0=',
         'email': 'dGVzdEBwYWkuY29t',
         'extension': 'e30=',
       },
     })
    .reply(200, {
      'kind': 'Secret',
      'apiVersion': 'v1',
      'metadata': {
          'name': 'test',
          'namespace': 'pai-user',
          'selfLink': '/api/v1/namespaces/pai-user/secrets/test',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z',
      },
      'data': {
        'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
        'username': 'dGVzdA==',
        'grouplist': 'WyJkZWZhdWx0IiwidmMxIl0=',
        'email': 'dGVzdEBwYWkuY29t',
        'extension': 'e30=',
      },
      'type': 'Opaque',
    });

    // mock for case2 username=test3
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7465737433')
      .times(2)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '7465737433',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ==',
          'username': 'dGVzdDM=',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIl0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    nock(apiServerRootUri)
      .put('/api/v1/namespaces/pai-user-v2/secrets/7465737433', {
        'metadata': {'name': '7465737433'},
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'dGVzdDM=',
          'grouplist': 'WyJkZWZhdWx0Il0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
       })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '7465737433',
          'namespace': 'pai-user',
          'selfLink': '/api/v1/namespaces/pai-user/secrets/existuser',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'dGVzdDM=',
          'grouplist': 'WyJkZWZhdWx0Il0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    // mock for case3 username=test2
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7465737432')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '7465737432',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'dGVzdDI=',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIl0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    // mock for case4 username=test_invalid
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/74657374696e76616c6964')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '74657374696e76616c6964',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ==',
          'username': 'dGVzdGludmFsaWQ=',
          'grouplist': 'WyJkZWZhdWx0Il0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    // mock for case5 username=non_exist
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/6e6f6e5f6578697374')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'6e6f6e5f6578697374\' not found',
        'reason': 'NotFound',
        'details': {
          'name': '6e6f6e5f6578697374',
          'kind': 'secrets',
        },
        'code': 404,
      });

    // mock for case6 username=test6
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7465737436')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '7465737436',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'dGVzdDY=',
          'grouplist': 'WyJkZWZhdWx0Il0=',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    // mock for case7 username=test7
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/7465737437')
      .times(2)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '7465737437',
        },
        'data': {
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'dGVzdDc=',
          'grouplist': 'WyJkZWZhdWx0IiwidmMxIiwidmMyIiwiYWRtaW5Hcm91cCJd',
          'email': 'dGVzdEBwYWkuY29t',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .times(8)
      .reply(200, defaultGroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766331')
      .times(8)
      .reply(200, vc1GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/766332')
      .times(8)
      .reply(200, vc2GroupSchema)
      .get('/api/v1/namespaces/pai-group/secrets/61646d696e47726f7570')
      .times(8)
      .reply(200, adminGroupSchema);
  });

  //
  // Positive cases
  //
  it('Case 1 (Positive): should update non-admin user with valid virtual cluster successfully', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/test/virtualcluster')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'virtualCluster': ['default', 'vc1']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Update user virtualCluster data successfully.');
        done();
      });
  });

  it('Case 2 (Positive): should delete all virtual clusters except default when virtual cluster value sets to be empty ', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/test3/virtualcluster')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'virtualCluster': []})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Update user virtualCluster data successfully.');
        done();
      });
  });


  // Negative cases
  it('Case 3 (Negative): add new user with invalid virtual cluster, should return error NoVirtualClusterError', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/test2/virtualcluster')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'virtualCluster': ['non_exist_vc']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoVirtualClusterError');
        done();
      });
  });

  it('Case 4 (Negative): should fail to update non-admin user with invalid virtual cluster', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/test_invalid/virtualcluster')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'virtualCluster': ['non_exist_vc']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoVirtualClusterError');
        done();
      });
  });

  it('Case 5 (Negative): should fail to update non-exist user virtual cluster', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/non_exist/virtualcluster')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'virtualCluster': ['default']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
    });
  });

  it('Case 6 (Negative): should fail to update user with virtual cluster by non-admin user', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('userX');
    global.chai.request(global.server)
      .put('/api/v2/user/test6/virtualcluster')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send({'virtualCluster': ['default']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

  it('Case 7 (Negative): should fail to update admin virtual cluster', (done) => {
    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/user/test7/virtualcluster')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'virtualCluster': ['default']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });
});

describe('get user info list : get /api/v1/user', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/')
      .reply(200, {
        'kind': 'SecretList',
        'apiVersion': 'v1',
        'metadata': {
          'selfLink': '/api/v1/namespaces/pai-user/secrets/',
          'resourceVersion': '1062682',
        },
        'items': [
          {
            'metadata': {
              'name': 'cantest001',
            },
            'data': {
              'admin': 'ZmFsc2U=',
              'password': 'OGRiYjYyMWEwYWY0Y2NhMDk3NTU5MmJkNzQ0M2NkNzc5YzRkYjEwMzA2NGExYTE1MWI4YjAyYmNkZjJkYmEwNjBlMzFhNTRhYzI4MjJlYjZmZTY0ZTgxM2ZkODg0MzI5ZjNiYTYwMGFlNmQ2NjMzNGYwYjhkYzIwYTIyM2MzOWU=',
              'username': 'Y2FudGVzdDAwMQ==',
              'virtualCluster': 'ZGVmYXVsdA==',
            },
            'type': 'Opaque',
          },
          {
            'metadata': {
              'name': 'paitest',
            },
            'data': {
              'admin': 'dHJ1ZQ==',
              'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
              'username': 'cGFpdGVzdA==',
              'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz',
            },
            'type': 'Opaque',
          },
        ],
      });
  });

  //
  // Get a valid token that expires in 60 seconds.
  //

  // const validToken = global.jwt.sign({ username: 'admin_user', admin: true }, process.env.JWT_SECRET, { expiresIn: 60 });
  // const nonAdminToken = global.jwt.sign({ username: 'non_admin_user', admin: false }, process.env.JWT_SECRET, { expiresIn: 60 });
  // const invalidToken = '';

  // //
  // // Positive cases
  // //

  // it('Case 1 (Positive): should get user info successfully with admin valid token', (done) => {
  //   global.chai.request(global.server)
  //     .get('/api/v1/user')
  //     .set('Authorization', 'Bearer ' + validToken)
  //     .end((err, res) => {
  //       global.chai.expect(res, 'status code').to.have.status(200);
  //       global.chai.expect(res, 'response format').be.json;
  //       global.chai.expect(res.body.length, 'job list length').to.equal(2);
  //       done();
  //     });
  // });

  //
  // Negative cases
  //

  // it('Case 1 (Negative): should fail to get user list with non-admin token', (done) => {
  //   global.chai.request(global.server)
  //     .get('/api/v1/user')
  //     .set('Authorization', 'Bearer ' + nonAdminToken)
  //     .end((err, res) => {
  //       global.chai.expect(res, 'status code').to.have.status(403);
  //       global.chai.expect(res, 'response format').be.json;
  //       global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
  //       done();
  //     });
  // });
});

