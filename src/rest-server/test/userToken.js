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

const getTokenTemplate = JSON.stringify({
  'username': '{{username}}',
  'password': '{{password}}',
});

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
  'type': 'Opaque'
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
    'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbInZjMSJdfX0=' // {"acls":{"admin":false,"virtualClusters":["vc1"]}}
  },
  'type': 'Opaque'
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
    'extension': 'eyJhY2xzIjp7ImFkbWluIjpmYWxzZSwidmlydHVhbENsdXN0ZXJzIjpbInZjMiJdfX0=' // {"acls":{"admin":false,"virtualClusters":["vc2"]}}
  },
  'type': 'Opaque'
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
    'extension': 'eyJhY2xzIjp7ImFkbWluIjp0cnVlLCJ2aXJ0dWFsQ2x1c3RlcnMiOlsiZGVmYXVsdCIsInZjMSIsInZjMiJdfX0=' // {"acls":{"admin":true,"virtualClusters":["default","vc1","vc2"]}}
  },
  'type': 'Opaque'
};


//
// Get a valid token that expires in 60 seconds.
//

const validToken = global.jwt.sign({username: 'test_user', admin: true}, process.env.JWT_SECRET, {expiresIn: 60});
// const invalidToken = '';
const expireToken = global.jwt.sign({username: 'test_user', admin: true}, process.env.JWT_SECRET, {expiresIn: '1s'});

describe('user token test: post /api/v1/authn/basic/login', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
    // mock for case 1 username=tokentest
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user-v2/secrets/746f6b656e74657374')
      .times(3)
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '746f6b656e74657374',
        },
        'data': {
            'password': 'MzdhM2Q3NzViZGYzYzhiZDZjY2Y0OTRiNzZkMjk3ZjZhNWNlNDhlNmY5Yjg1MjZlMDVlZmVlYjY0NDY4OTc2OGEwZTlmZjc0NmE2NDM1NTM4YjllN2M5MDM5Y2IxMzlkYTM3OWU0NWU3ZTdlODUzOTA2ZmE2YTc5MGUwOTRmNzI=',
            'username': 'dG9rZW50ZXN0',
            'grouplist': 'WyJhZG1pbkdyb3VwIl0=',
            'extension': 'e30=',
            'email': 'dGVzdEBwYWkuY29t',
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

    nock(apiServerRootUri)
    .get('/api/v1/namespaces/pai-user-v2/secrets/nonexist')
    .reply(404, {
      'kind': 'Status',
      'apiVersion': 'v1',
      'metadata': {},
      'status': 'Failure',
      'message': 'secrets \'nonexist\' not found',
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

  it('Case 1 (Positive): Return valid token with right username and password', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .set('Authorization', 'Bearer ' + validToken)
      .set('Host', 'example.test')
      .send(JSON.parse(global.mustache.render(getTokenTemplate, {'username': 'tokentest', 'password': '123456'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 2 (Negative): Should authenticate failed with wrong password', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, {'username': 'tokentest', 'password': 'abcdef'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('IncorrectPasswordError');
        done();
      });
  });

  it('Case 3 (Negative): Should authenticate failed with non-exist user', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, {'username': 'nonexist', 'password': 'abcdef'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });

  it('Case 4 (Negative): Should authenticate failed with an expired token', (done) => {
    setTimeout(function() {
      global.chai.request(global.server)
        .get('/api/v2/user')
        .set('Authorization', 'Bearer ' + expireToken)
        .send()
        .end((err, res) => {
          global.chai.expect(res, 'status code').to.have.status(401);
          global.chai.expect(res.body.code, 'response code').equal('UnauthorizedUserError');
          global.chai.expect(res.body.message, 'response message').equal('Your token is expired.');
          done();
        });
    }, 2);
  });
});
