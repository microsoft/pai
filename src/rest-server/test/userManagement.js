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

const deleteUserTemplate = JSON.stringify({
  'username': '{{username}}'
});

const updateUserVcTemplate = JSON.stringify({
  'virtualClusters': '{{virtualClusters}}'
});

//
// Get a valid token that expires in 60 seconds.
//

const validToken = global.jwt.sign({ username: 'new_user', admin: true }, process.env.JWT_SECRET, { expiresIn: 60 });
const nonAdminToken = global.jwt.sign({ username: 'non_admin_user', admin: false }, process.env.JWT_SECRET, { expiresIn: 60 });
const invalidToken = '';

describe('Add new user: put /api/v1/user', () => {
  after(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  before(() => {

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/newuser')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'newuser\' not found',
        'reason': 'NotFound',
        'details': {
          'name': 'newuser',
          'kind': 'secrets'
        },
        'code': 404
      });

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


    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user/secrets', {
        'metadata': {'name': 'newuser'},
        'data': {
          'admin': 'dHJ1ZQ==',
          'password': 'MDkxZjc0YzZjNTYyOWExZTlmN2Y3N2ZlMjc1Mjk1NmNkYmQ4ZmNlMjRlZmM4NmUxODJlMzQ5ZmI3MzJhMjRkNTU5ZmQ5NWExYzVjZjZiNzNhZWQzNjA3ZDcxYmU3YjA0ZDMyZjcwNTJjMzdlMTEwNTUzMDliNWIwMjczNmFjNDE=',
          'username': 'bmV3dXNlcg==',
          'virtualCluster': 'ZGVmYXVsdCx2YzEsdmMy'
        }
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': 'newuser',
            'namespace': 'pai-user',
            'selfLink': '/api/v1/namespaces/pai-user/secrets/newuser',
            'uid': 'f75b6065-f9c7-11e8-b564-000d3ab5296b',
            'resourceVersion': '1116114',
            'creationTimestamp': '2018-12-07T02:29:47Z'
        },
        'data': {
          'admin': 'dHJ1ZQ==',
          'password': 'MDkxZjc0YzZjNTYyOWExZTlmN2Y3N2ZlMjc1Mjk1NmNkYmQ4ZmNlMjRlZmM4NmUxODJlMzQ5ZmI3MzJhMjRkNTU5ZmQ5NWExYzVjZjZiNzNhZWQzNjA3ZDcxYmU3YjA0ZDMyZjcwNTJjMzdlMTEwNTUzMDliNWIwMjczNmFjNDE=',
          'username': 'bmV3dXNlcg==',
          'virtualCluster': 'ZGVmYXVsdCx2YzEsdmMy'
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/nonadmin')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'nonadmin\' not found',
        'reason': 'NotFound',
        'details': {
          'name': 'nonadmin',
          'kind': 'secrets'
        },
        'code': 404
      });

    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user/secrets', {
        'metadata': {'name': 'nonadmin'},
        'data': {
          'admin': 'ZmFsc2U=',
          'password': 'YmIyOTY0NDQwNDBhNmI0MzE3MDcwZmUzM2JiNzk5MmYwMjg0OTc3MmM4YmE1MjY2YTIzM2YzMzk5OTRjM2QwODEzOTc3YWYxYTQ5ZmE0YzJlM2U5NTYxODNiMWE1ZjAxOTIwNzkxY2UxYWM5YTRjNDJhODQ0OTk2ZjI3NWI1N2U=',
          'username': 'bm9uYWRtaW4=',
        }
      })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': 'newuser',
            'namespace': 'pai-user',
            'selfLink': '/api/v1/namespaces/pai-user/secrets/newuser',
            'uid': 'f75b6065-f9c7-11e8-b564-000d3ab5296b',
            'resourceVersion': '1116114',
            'creationTimestamp': '2018-12-07T02:29:47Z'
        },
        'data': {
          'admin': 'dHJ1ZQ==',
          'password': 'YmIyOTY0NDQwNDBhNmI0MzE3MDcwZmUzM2JiNzk5MmYwMjg0OTc3MmM4YmE1MjY2YTIzM2YzMzk5OTRjM2QwODEzOTc3YWYxYTQ5ZmE0YzJlM2U5NTYxODNiMWE1ZjAxOTIwNzkxY2UxYWM5YTRjNDJhODQ0OTk2ZjI3NWI1N2U=',
          'username': 'bm9uYWRtaW4=',
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/newuser')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'newuser\' not found',
        'reason': 'NotFound',
        'details': {
          'name': 'newuser',
          'kind': 'secrets'
        },
        'code': 404
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/existuser')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'existuser',
        },
        'data': {
          'admin': 'dHJ1ZQ==',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'ZXhpc3R1c2Vy',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });


});


  //
  // Positive cases
  //

  it('Case 1 (Positive): Add admin user', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'newuser', 'password': '123456', 'admin': true, 'modify': false })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update successfully');
        done();
      });
  });

  it('Case 2 (Positive): Add non-admin user', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'nonadmin', 'password': '123456', 'modify': false })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update successfully');
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 3 (Negative): Should fail to add new user with modify=true.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'newuser', 'password': '123456', 'admin': true, 'modify': true })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });

  it('Case 4 (Negative): Should fail to add user with non-admin token.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send({ 'username': 'test_user', 'password': '123456', 'admin': true, 'modify': false })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

  it('Case 5 (Negative): Should fail to add user with exist name.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'existuser', 'password': '123456', 'admin': true, 'modify': false })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(409);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ConflictUserError');
        done();
      });
  });
});

describe('update user: put /api/v1/user', () => {
  after(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  before(() => {

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/updateuser')
      .times(2)
      .reply(200,  {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': 'updateuser',
        },
        'data': {
            'admin': 'ZmFsc2U=',
            'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
            'username': 'dXBkYXRldXNlcg==',
            'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz',
            'githubPAT':'',
        },
        'type': 'Opaque'
    });

    nock(apiServerRootUri)
    .put('/api/v1/namespaces/pai-user/secrets/updateuser', {
      'metadata':{'name':'updateuser'},
      'data': {
         'admin': 'ZmFsc2U=',
         'password': 'YWJhNGI5NzdkNjk1NWNlOTVkZThlNzQwMTY2NWEzNWQxNTg4NjJmNmU5ZWI0YzEzZDJhZjM4Y2I3MWU1M2ZiMjc1Y2Q0YjI1ODBiNzZkMmIxMzZlY2U5YWJlZDYyMzllNDQ3YTI5YTYyNmEzNDAyYzEzMWYwZWQ3NTcwMjcyNmY=',
         'username': 'dXBkYXRldXNlcg==',
         'virtualCluster':'ZGVmYXVsdCx2YzIsdmMz',
         'githubPAT':'',
       }
     })
    .reply(200, {
      'kind': 'Secret',
      'apiVersion': 'v1',
      'metadata': {
          'name': 'updateuser',
          'namespace': 'pai-user',
          'selfLink': '/api/v1/namespaces/pai-user/secrets/updateuser',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z'
      },
      'data': {
          'admin': 'ZmFsc2U=',
          'password': 'YWJhNGI5NzdkNjk1NWNlOTVkZThlNzQwMTY2NWEzNWQxNTg4NjJmNmU5ZWI0YzEzZDJhZjM4Y2I3MWU1M2ZiMjc1Y2Q0YjI1ODBiNzZkMmIxMzZlY2U5YWJlZDYyMzllNDQ3YTI5YTYyNmEzNDAyYzEzMWYwZWQ3NTcwMjcyNmY=',
          'username': 'dXBkYXRldXNlcg==',
          'virtualCluster':'ZGVmYXVsdCx2YzIsdmMz',
          'githubPAT':'',
      },
      'type': 'Opaque'
    });

    nock(apiServerRootUri)
    .put('/api/v1/namespaces/pai-user/secrets/updateuser', {
      'metadata':{'name':'updateuser'},
      'data': {
         'admin': 'ZmFsc2U=',
         'password': 'YWJhNGI5NzdkNjk1NWNlOTVkZThlNzQwMTY2NWEzNWQxNTg4NjJmNmU5ZWI0YzEzZDJhZjM4Y2I3MWU1M2ZiMjc1Y2Q0YjI1ODBiNzZkMmIxMzZlY2U5YWJlZDYyMzllNDQ3YTI5YTYyNmEzNDAyYzEzMWYwZWQ3NTcwMjcyNmY=',
         'username': 'dXBkYXRldXNlcg==',
         'virtualCluster':'ZGVmYXVsdCx2YzIsdmMz',
         'githubPAT':'',
       }
     })
    .reply(200, {
      'kind': 'Secret',
      'apiVersion': 'v1',
      'metadata': {
          'name': 'updateuser',
          'namespace': 'pai-user',
          'selfLink': '/api/v1/namespaces/pai-user/secrets/updateuser',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
          'resourceVersion': '1115478',
          'creationTimestamp': '2018-12-07T02:21:42Z'
      },
      'data': {
          'admin': 'ZmFsc2U=',
          'password': 'YWJhNGI5NzdkNjk1NWNlOTVkZThlNzQwMTY2NWEzNWQxNTg4NjJmNmU5ZWI0YzEzZDJhZjM4Y2I3MWU1M2ZiMjc1Y2Q0YjI1ODBiNzZkMmIxMzZlY2U5YWJlZDYyMzllNDQ3YTI5YTYyNmEzNDAyYzEzMWYwZWQ3NTcwMjcyNmY=',
          'username': 'dXBkYXRldXNlcg==',
          'virtualCluster':'ZGVmYXVsdCx2YzIsdmMz',
          'githubPAT':'',
      },
      'type': 'Opaque'
    });

    nock(apiServerRootUri)
    .get('/api/v1/namespaces/pai-user/secrets/nonexistuser')
    .reply(404, {
      'kind': 'Status',
      'apiVersion': 'v1',
      'metadata': {},
      'status': 'Failure',
      'message': 'secrets \'nonexistuser\' not found',
      'reason': 'NotFound',
      'details': {
          'name': 'nonexistuser',
          'kind': 'secrets'
      },
      'code': 404
    });


  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): Update user password.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'updateuser', 'password': 'abcdef', 'modify': true })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update successfully');
        done();
      });
  });

  it('Case 2 (Positive): Update user set admin=false.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'updateuser', 'password': 'abcdef', 'admin': false, 'modify': true })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update successfully');
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 3 (Negative): Should fail to modify a non-exist user.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'nonexistuser', 'password': 'abcdef', 'admin': false, 'modify': true })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });

  it('Case 4 (Negative): Should trigger validation error if password sets null.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send({ 'username': 'new_user', 'password': null, 'admin': false, 'modify': true })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        done();
      });
  });

  it('Case 5 (Negative): Should fail to update user with non-admin token.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send({ 'username': 'new_user', 'password': 'abcdef', 'admin': false, 'modify': true })
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

});

describe('delete user : delete /api/v1/user', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/nonadmin')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'paitest',
        },
        'data': {
          'admin': 'ZmFsc2U=',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'bm9uYWRtaW4K',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .delete('/api/v1/namespaces/pai-user/secrets/nonadmin')
      .reply(200, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Success',
        'details': {
          'name': 'nonadmin',
          'kind': 'secrets',
          'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b'
        }
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/admin')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'paitest',
        },
        'data': {
          'admin': 'dHJ1ZQ==',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'bm9uYWRtaW4K',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/nonexist')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'nonexist\' not found',
        'reason': 'NotFound',
        'details': {
            'name': 'nonexist',
            'kind': 'secrets'
        },
        'code': 404
      });
  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): delete exist non-admin user', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'nonadmin' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 2 (Negative): Should fail to delete admin user', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'admin' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('RemoveAdminError');
        done();
      });
  });

  it('Case 3 (Negative): Should fail to delete non-exist user.', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'nonexist' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(404);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });

  it('Case 4 (Negative): Should fail to delete user with non-admin token.', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_non_admin_user' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        done();
      });
  });
});

describe('update user virtual cluster : put /api/v1/user/:username/virtualClusters', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {
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

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/test')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': 'test',
        },
        'data': {
            'admin': 'ZmFsc2U=',
            'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
            'username': 'cGFpdGVzdA==',
            'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
    });

    nock(apiServerRootUri)
    .put('/api/v1/namespaces/pai-user/secrets/test', {
      'metadata':{'name':'test'},
      'data': {
         'admin': 'ZmFsc2U=',
         'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
         'username': 'dGVzdA==',
         'virtualCluster':'ZGVmYXVsdCx2YzE=',
         'githubPAT':''
       }
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
          'creationTimestamp': '2018-12-07T02:21:42Z'
      },
      'data': {
          'admin': 'ZmFsc2U=',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'dGVzdA==',
          'virtualCluster':'ZGVmYXVsdCx2YzE=',
          'githubPAT':''
      },
      'type': 'Opaque'
    });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/test2')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'test2',
        },
        'data': {
          'admin': 'ZmFsc2U=',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'cGFpdGVzdA==',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/testuser3')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'testuser3',
        },
        'data': {
          'admin': 'ZmFsc2U=',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ==',
          'username': 'dGVzdHVzZXIz',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .put('/api/v1/namespaces/pai-user/secrets/testuser3', {
        'metadata':{'name':'testuser3'},
        'data': {
           'admin': 'ZmFsc2U=',
           'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
           'username': 'dGVzdHVzZXIz',
           'virtualCluster':'ZGVmYXVsdA==',
           'githubPAT':''
         }
       })
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': 'testuser3',
            'namespace': 'pai-user',
            'selfLink': '/api/v1/namespaces/pai-user/secrets/existuser',
            'uid': 'd5d686ff-f9c6-11e8-b564-000d3ab5296b',
            'resourceVersion': '1115478',
            'creationTimestamp': '2018-12-07T02:21:42Z'
        },
        'data': {
            'admin': 'ZmFsc2U=',
            'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
            'username': 'dGVzdHVzZXIz',
            'virtualCluster':'ZGVmYXVsdA==',
            'githubPAT':''
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/testinvalid')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'testinvalid',
        },
        'data': {
          'admin': 'ZmFsc2U=',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ==',
          'username': 'dGVzdHVzZXIz',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/nonexist')
      .reply(404, {
        'kind': 'Status',
        'apiVersion': 'v1',
        'metadata': {},
        'status': 'Failure',
        'message': 'secrets \'nonexist\' not found',
        'reason': 'NotFound',
        'details': {
            'name': 'nonexist',
            'kind': 'secrets'
        },
        'code': 404
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/test3')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'test3',
        },
        'data': {
          'admin': 'ZmFsc2U=',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'cGFpdGVzdA==',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });

    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/test4')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
          'name': 'test3',
        },
        'data': {
          'admin': 'dHJ1ZQ==',
          'password': 'MzFhNzQ0YzNhZjg5MDU2MDI0ZmY2MmMzNTZmNTQ3ZGRjMzUzYWQ3MjdkMzEwYTc3MzcxODgxMjk4MmQ1YzZlZmMzYmZmNzBkYjVlMTA0M2JkMjFkMmVkYzg4M2M4Y2Q0ZjllNzRhMWU1MjA1NDMzNjQ5MzYxMTQ4YmE4OTY0MzQ=',
          'username': 'cGFpdGVzdA==',
          'virtualCluster': 'ZGVmYXVsdCx2YzIsdmMz'
        },
        'type': 'Opaque'
      });
  });

  //
  // Get a valid token that expires in 60 seconds.
  //

  const validToken = global.jwt.sign({ username: 'admin_user', admin: true }, process.env.JWT_SECRET, { expiresIn: 60 });
  const nonAdminToken = global.jwt.sign({ username: 'non_admin_user', admin: false }, process.env.JWT_SECRET, { expiresIn: 60 });
  const invalidToken = '';

  //
  // Positive cases
  //

  it('Case 1 (Positive): should update non-admin user with valid virtual cluster successfully', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'vc1' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user virtual clusters successfully');
        done();
      });
  });

  it('Case 2 (Positive): add new user with invalid virtual cluster should add default vc only and throw update vc error', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test2/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'non_exist_vc' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoVirtualClusterError');
        done();
      });
  });

  it('Case 3 (Positive): should delete all virtual clusters except default when virtual cluster value sets to be empty ', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/testuser3/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': '' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user virtual clusters successfully');
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 1 (Negative): should fail to update non-admin user with invalid virtual cluster', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/testinvalid/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'non_exist_vc' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoVirtualClusterError');
        done();
      });
  });

  it('Case 2 (Negative): should fail to update non-exist user virtual cluster', (done) => {
    global.chai.request(global.server)
    .put('/api/v1/user/nonexist/virtualClusters')
    .set('Authorization', 'Bearer ' + validToken)
    .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'default' })))
    .end((err, res) => {
      global.chai.expect(res, 'status code').to.have.status(404);
      global.chai.expect(res, 'response format').be.json;
      global.chai.expect(res.body.code, 'response code').equal('NoUserError');
      done();
    });
  });

  it('Case 3 (Negative): should fail to update user with virtual cluster by non-admin user', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test3/virtualClusters')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'default' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

  it('Case 4 (Negative): should fail to update admin virtual cluster', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test4/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'default' })))
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
      //this.test.error(new Error('Not all nock interceptors were used!'));
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
              'name': 'paitest',
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
  });

  //
  // Get a valid token that expires in 60 seconds.
  //

  const validToken = global.jwt.sign({ username: 'admin_user', admin: true }, process.env.JWT_SECRET, { expiresIn: 60 });
  const nonAdminToken = global.jwt.sign({ username: 'non_admin_user', admin: false }, process.env.JWT_SECRET, { expiresIn: 60 });
  const invalidToken = '';

  // //
  // // Positive cases
  // //

  it('Case 1 (Positive): should get user info successfully with admin valid token', (done) => {
    global.chai.request(global.server)
      .get('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.length, 'job list length').to.equal(2);
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 1 (Negative): should fail to get user list with non-admin token', (done) => {
    global.chai.request(global.server)
      .get('/api/v1/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

});

