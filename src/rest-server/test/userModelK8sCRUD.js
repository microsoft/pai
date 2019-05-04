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
const userK8sCRUD = require('../src/util/manager/user/crudK8sSecret');

const userK8sCRUDConfig = userK8sCRUD.initConfig(process.env.K8S_APISERVER_URI);

describe('k8s secret get function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
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
          'resourceVersion': '1062682'
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
              'virtualCluster': 'ZGVmYXVsdA=='
            },
            'type': 'Opaque'
          },
          {
            'metadata': {
              'name': 'pai_test',
            },
            'data': {
              'admin': 'dHJ1ZQ==',
              'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
              'username': 'cGFpdGVzdA==',
              'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
            },
            'type': 'Opaque'
          },
        ]
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
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
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
          'kind': 'secrets'
        },
        'code': 404
      });
  });

  // positive test case
  // get exist single key value pair
  it('Should return whole user list.', async () => {
    return userK8sCRUD.readAll(userK8sCRUDConfig).should.eventually.have.lengthOf(2);
  });

  // negative test case
  // get non-exist user
  it('Should report user not found error', async ()=> {
    return userK8sCRUD.read('non_exist', userK8sCRUDConfig).should.be.rejected;
  });

  // positive test case
  // find specific user
  it('Should return specific user info.', async () => {
    return userK8sCRUD.read('paitest', userK8sCRUDConfig).should.eventually.have.deep.members({
        username: 'paitest',
        password: '31a744c3af89056024ff62c356f547ddc353ad727d310a773718812982d5c6efc3bff70db5e1043bd21d2edc883c8cd4f9e74a1e5205433649361148ba896434',
        admin: 'true',
        virtualCluster: 'default,vc2,vc3',
        githubPAT: ''
    });
  });
});
