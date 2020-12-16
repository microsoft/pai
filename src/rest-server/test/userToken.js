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
'use strict';

const tokenModel = require('@pai/models/v2/token');

let getTokenTemplate = JSON.stringify({
  'username': '{{username}}',
  'password': '{{password}}',
});


//
// Get a valid token that expires in 60 seconds.
//

const adminToken = tokenModel.create('adminUser', true);
const normalToken = tokenModel.create('normalUser', false);
const invalidToken = 'abc-invalid-token';

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
      .twice()
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': '746f6b656e74657374',
        },
        'data': {
          'password': 'OGI4MjE4ZDAyOGI1MGE4ZjZlY2YyZmRmMjRkMjI5ODUxNjljMDg4NGNjNmU3NDE4MzgyY2U4OTMyYTFmNDczN2E2MjZjZjIwNmE3OWFkMGZlZTUwZjAxZGZlN2ExM2IxMWM2ZTc1ODUwYTNiMzE5NWRkYWUyZjBiODRlYmFhYTI=',
          'username': 'dG9rZW50ZXN0',
          'grouplist': 'WyJhZG1pbkdyb3VwIl0=',
          'extension': 'e30=',
          'email': 'dGVzdEBwYWkuY29t',
        },
        'type': 'Opaque',
      });

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

  it('Case 1 (Positive): Return valid token with right username and password.', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .set('Authorization', 'Bearer ' + adminToken)
      .set('Host', 'example.test')
      .send(JSON.parse(global.mustache.render(getTokenTemplate, {
        'username': 'tokentest',
        'password': '123456',
      })))
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
      .set('Authorization', 'Bearer ' + adminToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, {
        'username': 'tokentest',
        'password': 'abcdef',
      })))
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
      .set('Authorization', 'Bearer ' + adminToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, {
        'username': 'nonexist',
        'password': 'abcdef',
      })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });
});

describe('user token test: get /api/v2/token', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  it('Case 1 (Positive): Valid token.', (done) => {
    global.chai.request(global.server)
      .get('/api/v2/token')
      .set('Authorization', 'Bearer ' + adminToken)
      .set('Host', 'example.test')
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.userName, 'user name').equal('adminUser');
        done();
      });
  });

  it('Case 2 (Negative): Invalid token.', (done) => {
    global.chai.request(global.server)
      .get('/api/v2/token')
      .set('Authorization', 'Bearer ' + invalidToken)
      .set('Host', 'example.test')
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });
});

describe('user token test: post /api/v2/token', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      // TODO: Revamp this file and enable the following error.
      // this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  it('Case 1 (Positive): Admin impersonate admin.', (done) => {
    global.chai.request(global.server)
      .post('/api/v2/token')
      .set('Authorization', 'Bearer ' + adminToken)
      .set('Host', 'example.test')
      .send({
        userName: 'hemera',
        admin: true,
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  it('Case 2 (Positive): Admin impersonate normal.', (done) => {
    global.chai.request(global.server)
      .post('/api/v2/token')
      .set('Authorization', 'Bearer ' + adminToken)
      .set('Host', 'example.test')
      .send({
        userName: 'xxx',
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  it('Case 3 (Negative): Normal impersonate normal.', (done) => {
    global.chai.request(global.server)
      .post('/api/v2/token')
      .set('Authorization', 'Bearer ' + normalToken)
      .set('Host', 'example.test')
      .send({
        userName: 'xxx',
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  it('Case 4 (Negative): Normal becomes admin.', (done) => {
    global.chai.request(global.server)
      .post('/api/v2/token')
      .set('Authorization', 'Bearer ' + normalToken)
      .set('Host', 'example.test')
      .send({
        admin: true,
      })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  it('Case 5 (Positive): Normal extend token.', (done) => {
    global.chai.request(global.server)
      .post('/api/v2/token')
      .set('Authorization', 'Bearer ' + normalToken)
      .set('Host', 'example.test')
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });
});
