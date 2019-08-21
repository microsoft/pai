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
const groupK8sCRUD = require('@pai/utils/manager/group/crudK8sSecret');

const groupK8sCRUDConfig = groupK8sCRUD.initConfig(process.env.K8S_APISERVER_URI);

describe('Group model k8s secret get function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    // Mock for case1 return all groupinfo
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets')
      .reply(200, {
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
              'groupname': 'Y2FudGVzdDAwMQ==',
              'description': 'dGVzdA==',
              'externalName': 'MTIzNA==',
              'extension': 'e30=',
            },
            'type': 'Opaque',
          },
          {
            'metadata': {
              'name': 'pai_test',
            },
            'data': {
              'groupname': 'cGFpdGVzdA==',
              'description': 'dGVzdA==',
              'externalName': 'MTIzNA==',
              'extension': 'e30=',
            },
            'type': 'Opaque',
          },
        ],
      });

    // mock for case3 groupname=paitest
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/70616974657374')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '70616974657374',
        },
        'data': {
          'groupname': 'cGFpdGVzdA==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'e30=',
        },
        'type': 'Opaque',
      });

    // mock for case2 groupname=non_exist
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/6e6f6e5f6578697374')
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
  it('Should return whole group list.', async () => {
    const res = await groupK8sCRUD.readAll(groupK8sCRUDConfig);
    return expect(res).to.have.lengthOf(2);
  });

  // negative test case
  // get non-exist user
  it('Should report user not found error', async ()=> {
    return await expect(groupK8sCRUD.read('non_exist', groupK8sCRUDConfig)).to.be.rejected;
  });

  // positive test case
  // find specific user
  it('Should return specific group info.', async () => {
    const res = await groupK8sCRUD.read('paitest', groupK8sCRUDConfig);
    return expect(res).to.deep.equal({
      groupname: 'paitest',
      description: 'test',
      externalName: '1234',
      extension: {
        acls: {
          admin: false,
          virtualClusters: [],
        },
      },
    });
  });
});

describe('Group model k8s secret set function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    // Mock for case2 groupname=existuser
    nock(apiServerRootUri)
      .put('/api/v1/namespaces/pai-group/secrets/657869737475736572', {
        'metadata': {'name': '657869737475736572'},
        'data': {
          'groupname': 'ZXhpc3R1c2Vy',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbXX19',
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '657869737475736572',
          'namespace': 'pai-group',
          'selfLink': '/api/v1/namespaces/pai-group/secrets/657869737475736572',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z',
        },
        'data': {
          'groupname': 'ZXhpc3R1c2Vy',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbXX19',
        },
        'type': 'Opaque',
      });

    // Mock for case1 groupname=newuser
    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-group/secrets', {
        'metadata': {'name': '6e657775736572'},
        'data': {
          'groupname': 'bmV3dXNlcg==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbXX19',
        },
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '6e657775736572',
          'namespace': 'pai-group',
          'selfLink': '/api/v1/namespaces/pai-group/secrets/6e657775736572',
          'uid': 'f75b6065-f9c7-11e8-b564-000d3ab5296b',
          'resourceVersion': '1116114',
          'creationTimestamp': '2018-12-07T02:29:47Z',
        },
        'data': {
          'groupname': 'bmV3dXNlcg==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbXX19',
        },
        'type': 'Opaque',
      });
  });

  // set a key value pair
  it('Should add a new group.', async () => {
    const updateGroup = {
      'groupname': 'newuser',
      'description': 'test',
      'externalName': '1234',
      'extension': {},
    };
    const res = await groupK8sCRUD.create('newuser', updateGroup, groupK8sCRUDConfig);
    return expect(res, 'status').to.have.status(200);
  });

  // update a group
  it('should update an exist new group', async () => {
    const updateGroup = {
      'groupname': 'existuser',
      'description': 'test',
      'externalName': '1234',
      'extension': {},
    };
    const res = await groupK8sCRUD.update('existuser', updateGroup, groupK8sCRUDConfig);
    return expect(res, 'status').to.have.status(200);
  });
});


describe('User Model k8s secret delete function test', () => {
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
      .delete('/api/v1/namespaces/pai-group/secrets/657869737475736572')
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
      .delete('/api/v1/namespaces/pai-group/secrets/6e6f6e657869737475736572')
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
  it('should delete an exist group successfully', async () => {
    const res = await groupK8sCRUD.remove('existuser', groupK8sCRUDConfig);
    return expect(res, 'status').to.have.status(200);
  });

  it('should failed to delete an non-exist user', async () => {
    return await expect(groupK8sCRUD.remove('nonexistuser', groupK8sCRUDConfig)).to.be.rejected;
  });
});
