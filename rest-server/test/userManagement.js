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

newUserTemplate = JSON.stringify({
  'username': '{{username}}',
  'password': '{{password}}',
  'admin': '{{admin}}',
  'modify': '{{modify}}',
});

deleteUserTemplate = JSON.stringify({
  'username': '{{username}}'
});

updateUserVcTemplate = JSON.stringify({
  'virtualClusters': '{{virtualClusters}}'
});

//
// Get a valid token that expires in 60 seconds.
//

const validToken = global.jwt.sign({ username: 'new_user', admin: true }, process.env.JWT_SECRET, { expiresIn: 60 });
const nonAdminToken = global.jwt.sign({ username: 'non_admin_user', admin: false }, process.env.JWT_SECRET, { expiresIn: 60 });
const invalidToken = '';

describe('Add new user: put /api/v1/user', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    nock(etcdHosts)
      .get('/v2/keys/users/new_user')
      .reply(200, {
        'errorCode': 100,
        'message': 'Key not found',
        'cause': '/test',
        'index': 1
      });

    nock(etcdHosts)
      .put('/v2/keys/users/new_user?dir=true')
      .reply(200, {
        'action': 'set',
        'node': {
          'key': '/users/new_user',
          'dir': true,
          'modifiedIndex': 2,
          'createdIndex': 2
        }
      });

    nock(etcdHosts)
      .put('/v2/keys/users/new_user/passwd', { 'value': '8507b5d862306d5bdad95b3d611b905ecdd047b0165ca3905db0d861e76bce8f3a8046e64379e81f54865f7c41b47e57cec887e5912062211bc9010afea8ab12' })
      .reply(200, {
        'action': 'set',
        'node': {
          'key': '/users/new_user/password',
          'value': '8507b5d862306d5bdad95b3d611b905ecdd047b0165ca3905db0d861e76bce8f3a8046e64379e81f54865f7c41b47e57cec887e5912062211bc9010afea8ab12',
          'modifiedIndex': 3,
          'createdIndex': 3
        }
      });

    nock(etcdHosts)
      .put('/v2/keys/users/new_user/admin', { 'value': 'true' })
      .reply(200, {
        'action': 'set',
        'node': {
          'key': '/users/new_user/admin',
          'value': 'true',
          'modifiedIndex': 4,
          'createdIndex': 4
        }
      });

  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): Add a admin user with modify is false.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'new_user', 'password': '123456', 'admin': true, 'modify': false })))
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

  it('Case 2 (Negative): Should fail to add new user with modify=true.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'new_user', 'password': '123456', 'admin': true, 'modify': true })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user failed');
        done();
      });
  });

  it('Case 3 (Negative): Should fail to add user with non-admin token.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'test_user', 'password': '123456', 'admin': true, 'modify': false })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('not authorized');
        done();
      });
  });
});

describe('update user: put /api/v1/user', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    nock(etcdHosts)
      .put('/v2/keys/users/update_user?dir=true')
      .reply(200, {
        'action': 'set',
        'node': {
          'key': '/users/update_user',
          'dir': true,
          'modifiedIndex': 5,
          'createdIndex': 5
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/update_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/update_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/update_user/admin',
              'value': 'true',
              'modifiedIndex': 6,
              'createdIndex': 6
            }, {
              'key': '/users/update_user/passwd',
              'value': '194555a225f974d4cb864ce56ad713ed5e5a2b27a905669b31b1c9da4cebb91259e9e6f075eb8e8d9e3e2c9bd499ed5f5566e238d8b0eeead20d02aa33f8b669',
              'modifiedIndex': 7,
              'createdIndex': 7
            }],
          'modifiedIndex': 8,
          'createdIndex': 8
        }
      });


    nock(etcdHosts)
      .put('/v2/keys/users/update_user/passwd?prevExist=true', { 'value': '5e8f697ad7918d757e7c21c897bb4fccaa5ba1f3ecd11d3e61c6db7e1410f4d9ae4745accb97622ead6e38f91c328154af838098f5796c3de81fe7f6c14b817b' })
      .reply(200, {
        'action': 'update',
        'node': {
          'key': '/users/update_user/passwd',
          'value': '5e8f697ad7918d757e7c21c897bb4fccaa5ba1f3ecd11d3e61c6db7e1410f4d9ae4745accb97622ead6e38f91c328154af838098f5796c3de81fe7f6c14b817b',
          'modifiedIndex': 9,
          'createdIndex': 9
        },
        'prevNode': {
          'key': '/users/update_user/passwd',
          'value': '194555a225f974d4cb864ce56ad713ed5e5a2b27a905669b31b1c9da4cebb91259e9e6f075eb8e8d9e3e2c9bd499ed5f5566e238d8b0eeead20d02aa33f8b669',
          'modifiedIndex': 10,
          'createdIndex': 10
        }
      });

    nock(etcdHosts)
      .put('/v2/keys/users/update_user/admin', { 'value': 'false' })
      .reply(200, {
        'action': 'update',
        'node': {
          'key': '/users/update_user/admin',
          'value': 'false',
          'modifiedIndex': 11,
          'createdIndex': 11
        },
        'prevNode': {
          'key': '/users/update_user/admin',
          'value': 'true',
          'modifiedIndex': 12,
          'createdIndex': 12
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/non_exist_user')
      .reply(200, {
        'errorCode': 100,
        'message': 'Key not found',
        'cause': '/users/non_exist_user',
        'index': 4242650
      });

  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): Update user password.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'update_user', 'password': 'abcdef', 'admin': false, 'modify': true })))
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
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'update_user', 'password': 'abcdef', 'admin': false, 'modify': true })))
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
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'non_exist_user', 'password': 'abcdef', 'admin': false, 'modify': true })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user failed');
        done();
      });
  });

  it('Case 4 (Negative): Should trigger validation error if password sets null.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'new_user', 'password': null, 'admin': false, 'modify': true })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        done();
      });
  });

  it('Case 5 (Negative): Should fail to update user with non-admin token.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'new_user', 'password': 'abcdef', 'admin': false, 'modify': true })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
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

    nock(etcdHosts)
      .get('/v2/keys/users/delete_admin_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/delete_admin_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/delete_admin_user/admin',
              'value': 'true',
              'modifiedIndex': 13,
              'createdIndex': 13
            }, {
              'key': '/users/delete_admin_user/passwd',
              'value': '8507b5d862306d5bdad95b3d611b905ecdd047b0165ca3905db0d861e76bce8f3a8046e64379e81f54865f7c41b47e57cec887e5912062211bc9010afea8ab12',
              'modifiedIndex': 14,
              'createdIndex': 14
            }],
          'modifiedIndex': 15,
          'createdIndex': 15
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/delete_admin_user/admin')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/delete_admin_user/admin',
          'value': 'true',
          'modifiedIndex': 16,
          'createdIndex': 16
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/delete_non_exist_user')
      .reply(200, {
        'errorCode': 100,
        'message': 'Key not found',
        'cause': '/users/delete_non_exist_user',
        'index': 17
      });

    nock(etcdHosts)
      .get('/v2/keys/users/delete_non_admin_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/delete_non_admin_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/delete_non_admin_user/admin',
              'value': 'false',
              'modifiedIndex': 18,
              'createdIndex': 18
            }, {
              'key': '/users/delete_non_admin_user/passwd',
              'value': '8507b5d862306d5bdad95b3d611b905ecdd047b0165ca3905db0d861e76bce8f3a8046e64379e81f54865f7c41b47e57cec887e5912062211bc9010afea8ab12',
              'modifiedIndex': 19,
              'createdIndex': 19
            }],
          'modifiedIndex': 20,
          'createdIndex': 20
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/delete_non_admin_user/admin')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/delete_non_admin_user/admin',
          'value': 'false',
          'modifiedIndex': 21,
          'createdIndex': 21
        }
      });

    nock(etcdHosts)
      .delete('/v2/keys/users/delete_non_admin_user?recursive=true')
      .reply(200, {
        'action': 'delete',
        'node': {
          'key': '/delete_non_admin_user',
          'dir': true,
          'modifiedIndex': 22,
          'createdIndex': 22
        },
        'prevNode': {
          'key': '/delete_non_admin_user',
          'dir': true,
          'modifiedIndex': 23,
          'createdIndex': 23
        }
      });
  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): delete exist non-admin user', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_non_admin_user' })))
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
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_admin_user' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('remove failed');
        done();
      });
  });

  it('Case 3 (Negative): Should fail to delete non-exist user.', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_non_exist_user' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('remove failed');
        done();
      });
  });

  it('Case 4 (Negative): Should fail to delete user with non-admin token.', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_non_admin_user' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
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

    nock(etcdHosts)
      .get('/v2/keys/users/test_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/test_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/test_user/admin',
              'value': 'false',
              'modifiedIndex': 6,
              'createdIndex': 6
            }, {
              'key': '/users/test_user/passwd',
              'value': '194555a225f974d4cb864ce56ad713ed5e5a2b27a905669b31b1c9da4cebb91259e9e6f075eb8e8d9e3e2c9bd499ed5f5566e238d8b0eeead20d02aa33f8b669',
              'modifiedIndex': 7,
              'createdIndex': 7
            }],
          'modifiedIndex': 8,
          'createdIndex': 8
        }
      });

    nock(etcdHosts)
      .put('/v2/keys/users/test_user/virtualClusters', { 'value': 'default,vc1' })
      .reply(200, {
        'action': 'update',
        'node': {
          'key': '/users/test_user/virtualClusters',
          'value': 'default,vc1',
          'modifiedIndex': 11,
          'createdIndex': 11
        },
        'prevNode': {
          'key': '/users/test_user/virtualClusters',
          'value': 'default',
          'modifiedIndex': 12,
          'createdIndex': 12
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/test_non_admin_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/test_non_admin_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/test_non_admin_user/admin',
              'value': 'true',
              'modifiedIndex': 6,
              'createdIndex': 6
            }, {
              'key': '/users/test_non_admin_user/passwd',
              'value': '194555a225f974d4cb864ce56ad713ed5e5a2b27a905669b31b1c9da4cebb91259e9e6f075eb8e8d9e3e2c9bd499ed5f5566e238d8b0eeead20d02aa33f8b669',
              'modifiedIndex': 7,
              'createdIndex': 7
            }],
          'modifiedIndex': 8,
          'createdIndex': 8
        }
      });

    nock(etcdHosts)
      .put('/v2/keys/users/test_non_admin_user/virtualClusters', { 'value': 'default,vc1,vc2' })
      .reply(200, {
        'action': 'update',
        'node': {
          'key': '/users/test_non_admin_user/virtualClusters',
          'value': 'default,vc1,vc2',
          'modifiedIndex': 11,
          'createdIndex': 11
        },
        'prevNode': {
          'key': '/users/test_non_admin_user/virtualClusters',
          'value': 'default',
          'modifiedIndex': 12,
          'createdIndex': 12
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/test_invalid_vc_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/test_invalid_vc_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/test_invalid_vc_user/admin',
              'value': 'false',
              'modifiedIndex': 6,
              'createdIndex': 6
            }, {
              'key': '/users/test_invalid_vc_user/passwd',
              'value': '194555a225f974d4cb864ce56ad713ed5e5a2b27a905669b31b1c9da4cebb91259e9e6f075eb8e8d9e3e2c9bd499ed5f5566e238d8b0eeead20d02aa33f8b669',
              'modifiedIndex': 7,
              'createdIndex': 7
            }, {
              'key': '/users/test_invalid_vc_user/virtualClusters',
              'value': 'default,vc1',
              'modifiedIndex': 7,
              'createdIndex': 7
            }],
          'modifiedIndex': 8,
          'createdIndex': 8
        }
      });

      nock(etcdHosts)
      .get('/v2/keys/users/test_delete_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/test_delete_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/test_delete_user/admin',
              'value': 'false',
              'modifiedIndex': 6,
              'createdIndex': 6
            }, {
              'key': '/users/test_delete_user/passwd',
              'value': '194555a225f974d4cb864ce56ad713ed5e5a2b27a905669b31b1c9da4cebb91259e9e6f075eb8e8d9e3e2c9bd499ed5f5566e238d8b0eeead20d02aa33f8b669',
              'modifiedIndex': 7,
              'createdIndex': 7
            }, {
              'key': '/users/test_delete_user/virtualClusters',
              'value': 'default,vc1,vc2',
              'modifiedIndex': 7,
              'createdIndex': 7
            }],
          'modifiedIndex': 8,
          'createdIndex': 8
        }
      });

      nock(etcdHosts)
      .put('/v2/keys/users/test_delete_user/virtualClusters', { 'value': 'default' })
      .reply(200, {
        'action': 'update',
        'node': {
          'key': '/users/test_delete_user/virtualClusters',
          'value': 'default',
          'modifiedIndex': 11,
          'createdIndex': 11
        },
        'prevNode': {
          'key': '/users/test_delete_user/virtualClusters',
          'value': 'default,vc1,vc2',
          'modifiedIndex': 12,
          'createdIndex': 12
        }
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

  it('Case 1 (Positive): should update non-admin user with valid virtual cluster successfully', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test_user/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'vc1' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user virtual clusters successfully');
        done();
      });
  });

  it('Case 2 (Positive): should update admin user with all valid virtual cluster', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test_non_admin_user/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'default' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user virtual clusters successfully');
        done();
      });
  });

  it('Case 3 (Positive): add new user with invalid virtual cluster should add default vc only and throw update vc error', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test_user/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'non_exist_vc' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user virtual cluster failed');
        done();
      });
  });

  it('Case 4 (Positive): should delete all virtual clusters except default when virtual cluster value sets to be empty ', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/test_delete_user/virtualClusters')
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
      .put('/api/v1/user/test_invalid_vc_user/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'non_exist_vc' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update virtual cluster failed: could not find virtual cluster non_exist_vc');
        done();
      });
  });

  it('Case 2 (Negative): should fail to update non-exist user virtual cluster', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user/non_exist_user/virtualClusters')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(updateUserVcTemplate, { 'virtualClusters': 'default' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update user virtual cluster failed');
        done();
      });
  });

});

