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
const util = require('util');
const dbUtility = require('@pai/utils/dbUtil');

const db = dbUtility.getStorageObject('UserSecret', {
  'paiUserNameSpace': 'pai-user',
  'requestConfig': {
    baseURL: process.env.K8S_APISERVER_URI + '/api/v1/namespaces/',
    maxRedirects: 0,
  },
});
describe('k8s secret get function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    // Mock for case1 return all userinfo
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
                    'name': 'pai_test',
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

    // mock for case3 username=paitest
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/70616974657374')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '70616974657374',
        },
        'data': {
            'admin': 'dHJ1ZQ==',
            'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
            'username': 'cGFpdGVzdA==',
            'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz',
        },
        'type': 'Opaque',
    });


    // mock for case2 username=non_exist
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/6e6f6e5f6578697374')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'6e6f6e5f6578697374\' not found',
        'reason': 'NotFound',
        'details': {
            'name': 'nonexist',
            'kind': 'secrets',
        },
        'code': 404,
      });
    });


  // positive test case
  // get exist single key value pair
  it('should return whole user list', (done) => {
    const dbGet = util.callbackify(db.get.bind(db));
    dbGet('', null, (err, res) => {
      expect(res).to.have.lengthOf(2);
      done();
    });
  });

  // negative test case
  // get non-exist user
  it('should report user not found error', (done) => {
    const dbGet = util.callbackify(db.get.bind(db));
    dbGet('non_exist', null, (err, res) => {
      expect(err.status).to.be.equal(404);
      done();
    });
  });

  // positive test case
  // find specific user
  it('should return specific user info', (done) => {
    const dbGet = util.callbackify(db.get.bind(db));
    dbGet('paitest', null, (err, res) => {
      expect(res).to.have.lengthOf(1);
      expect(res).to.have.deep.members([{
        username: 'paitest',
        password: '31a744c3af89056024ff62c356f547ddc353ad727d310a773718812982d5c6efc3bff70db5e1043bd21d2edc883c8cd4f9e74a1e5205433649361148ba896434',
        admin: 'true',
        virtualCluster: 'default,vc2,vc3',
        githubPAT: '',
      }]);
      done();
    });
  });
});

describe('k8s secret set function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    // Mock for case2 username=existuser
    nock(apiServerRootUri)
      .put('/api/v1/namespaces/pai-user/secrets/657869737475736572', {
        'metadata': {'name': '657869737475736572'},
        'data': {
           'admin': 'ZmFsc2U=',
           'password': 'cGFpNjY2',
           'username': 'ZXhpc3R1c2Vy',
         },
       })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '657869737475736572',
            'namespace': 'pai-user',
            'selfLink': '/api/v1/namespaces/pai-user/secrets/657869737475736572',
            'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
            'resourceVersion': '1115478',
            'creationTimestamp': '2018-12-07T02:21:42Z',
        },
        'data': {
            'admin': 'ZmFsc2U=',
            'password': 'cGFpNjY2',
            'username': 'ZXhpc3R1c2Vy',
        },
        'type': 'Opaque',
      });

    // Mock for case2 username=newuser
    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user/secrets', {
        'metadata': {'name': '6e657775736572'},
        'data': {
          'admin': 'ZmFsc2U=',
          'password': 'cGFpNjY2',
          'username': 'bmV3dXNlcg==',
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '6e657775736572',
            'namespace': 'pai-user',
            'selfLink': '/api/v1/namespaces/pai-user/secrets/6e657775736572',
            'uid': 'f75b6065-f9c7-11e8-b564-000d3ab5296b',
            'resourceVersion': '1116114',
            'creationTimestamp': '2018-12-07T02:29:47Z',
        },
        'data': {
            'admin': 'ZmFsc2U=',
            'password': 'cGFpNjY2',
            'username': 'bmV3dXNlcg==',
        },
        'type': 'Opaque',
      });
  });

  // set a key value pair
  it('should add a new user', (done) => {
    const dbSet = util.callbackify(db.set.bind(db));
    const updateUser = {
      'username': 'newuser',
      'password': 'pai666',
      'admin': false,
      'modify': false,
    };
    dbSet('newuser', updateUser, null, (err, res) => {
      expect(err).to.be.null;
      expect(res, 'status').to.have.status(200);
      done();
    });
  });

  // update a user
  it('should update an exist new user', (done) => {
    const dbSet = util.callbackify(db.set.bind(db));
    const updateUser = {
      'username': 'existuser',
      'password': 'pai666',
      'admin': false,
      'modify': false,
    };
    const options = {'update': true};
    dbSet('existuser', updateUser, options, (err, res) => {
      expect(err).to.be.null;
      expect(res, 'status').to.have.status(200);
      done();
    });
  });
});

describe('k8s secret delete function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    // Mock for case1 username=existuser
    nock(apiServerRootUri)
      .delete('/api/v1/namespaces/pai-user/secrets/657869737475736572')
      .reply(200, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Success',
        'details': {
            'name': '657869737475736572',
            'kind': 'secrets',
            'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
        },
      });

    // Mock for case2 username=nonexistuser
    nock(apiServerRootUri)
    .delete('/api/v1/namespaces/pai-user/secrets/6e6f6e657869737475736572')
    .reply(404, {
      'kind': 'Status',
      'apiVersion': 'v1',
      'metadata': {},
      'status': 'Failure',
      'message': 'secrets \'6e6f6e657869737475736572\' not found',
      'reason': 'NotFound',
      'details': {
          'name': '6e6f6e657869737475736572',
          'kind': 'secrets',
      },
      'code': 404,
    });
  });

  // delete exist user
  it('should delete an exist user successfully', (done) => {
    const dbDelete = util.callbackify(db.delete.bind(db));
    dbDelete('existuser', (err, res) => {
      expect(err).to.be.null;
      expect(res, 'status').to.have.status(200);
      done();
    });
  });

  it('should failed to delete an non-exist user', (done) => {
    const dbDelete = util.callbackify(db.delete.bind(db));
    dbDelete('nonexistuser', (err, res) => {
      expect(err, 'status').to.have.status(404);
      done();
    });
  });
});
