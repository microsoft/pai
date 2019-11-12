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

// const invalidToken = '';

describe('Group Model k8s secret extension attrs update test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('Case 1 (Positive): should update group extension vc', (done) => {
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema);

    nock(apiServerRootUri)
      .put('/api/v1/namespaces/pai-group/secrets/64656661756c74', {
        'metadata': {'name': '64656661756c74'},
        'data': {
          'groupname': 'ZGVmYXVsdA==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbImRlZmF1bHQiLCJ2YzEiXX19', // {"acls":{"admin":false,"virtualClusters":["default","vc1"]}}
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
          'groupname': 'ZGVmYXVsdA==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbImRlZmF1bHQiLCJ2YzEiXX19',
        },
        'type': 'Opaque',
      });

    const validToken = nockUtils.registerAdminTokenCheck('adminX');

    global.chai.request(global.server)
      .put('/api/v2/group/default/extension/acls/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'data': ['default', 'vc1']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Update group extension data successfully.');
        done();
      });
  });

  it('Case 2 (Negative): non-admin should not update group extension vc', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('userX');
    global.chai.request(global.server)
      .put('/api/v2/group/default/extension/acls/virtualClusters')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send({'data': ['default', 'vc1']})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Non-admin is not allow to do this operation.');
        done();
      });
    });

  it('Case 3 (Positive): should update group extension admin', (done) => {
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema);

    nock(apiServerRootUri)
      .put('/api/v1/namespaces/pai-group/secrets/64656661756c74', {
        'metadata': {'name': '64656661756c74'},
        'data': {
          'groupname': 'ZGVmYXVsdA==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjp0cnVlLCJ2aXJ0dWFsQ2x1c3RlcnMiOlsiZGVmYXVsdCJdfX0=', // {"acls":{"admin":true,"virtualClusters":["default"]}}
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
          'groupname': 'ZGVmYXVsdA==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjp0cnVlLCJ2aXJ0dWFsQ2x1c3RlcnMiOlsiZGVmYXVsdCJdfX0=',
        },
        'type': 'Opaque',
      });

    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/group/default/extension/acls/admin')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'data': true})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Update group extension data successfully.');
        done();
      });
  });

  it('Case 4 (Negative): should not update non-exist group extension', (done) => {
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/6e6f6e2d6578697374')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'6e6f6e2d6578697374\' not found',
        'reason': 'NotFound',
        'details': {
          'name': 'nonexist',
          'kind': 'secrets',
        },
        'code': 404,
      });

    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/group/non-exist/extension/acls/admin')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'data': true})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Group non-exist is not found.');
        done();
      });
  });

  it('Case 5 (Positive): should add new group extension field', (done) => {
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-group/secrets/64656661756c74')
      .reply(200, defaultGroupSchema);

    nock(apiServerRootUri)
      .put('/api/v1/namespaces/pai-group/secrets/64656661756c74', {
        'metadata': {'name': '64656661756c74'},
        'data': {
          'groupname': 'ZGVmYXVsdA==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbImRlZmF1bHQiXX0sInRlc3RmaWVsZCI6InRlc3RkYXRhIn0=', // {"acls":{"admin":false,"virtualClusters":["default"]},"testfield":"testdata"}
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
          'groupname': 'ZGVmYXVsdA==',
          'description': 'dGVzdA==',
          'externalName': 'MTIzNA==',
          'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbImRlZmF1bHQiXX0sInRlc3RmaWVsZCI6InRlc3RkYXRhIn0=',
        },
        'type': 'Opaque',
      });

    const validToken = nockUtils.registerAdminTokenCheck('adminX');
    global.chai.request(global.server)
      .put('/api/v2/group/default/extension/testfield')
      .set('Authorization', 'Bearer ' + validToken)
      .send({'data': 'testdata'})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('Update group extension data successfully.');
        done();
      });
  });
});

