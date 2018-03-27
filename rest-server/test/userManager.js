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


//
// Get a valid token that expires in 60 seconds.
//

const validToken = global.jwt.sign({ username: 'new_user', admin: true }, process.env.JWT_SECRET, { expiresIn: 60 });
const invalidToken = '';

describe('Add new user: put /api/v1/user', () => {
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

  it('Case 2 (Negative): Add a new admin user failed because modify value is true.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'new_user', 'password': '123456', 'admin': true, 'modify': true })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update failed');
        done();
      });
  });
});

describe('update user: put /api/v1/user', () => {
  beforeEach(() => {

    nock(etcdHosts)
      .put('/v2/keys/users/new_user?dir=true')
      .reply(200, {
        'action': 'set',
        'node': {
          'key': '/users/new_user',
          'dir': true,
          'modifiedIndex': 5,
          'createdIndex': 5
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/users/new_user')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/admin',
          'dir': true,
          'nodes':
            [{
              'key': '/users/admin/admin',
              'value': 'true',
              'modifiedIndex': 6,
              'createdIndex': 6
            }, {
              'key': '/users/admin/passwd',
              'value': '8507b5d862306d5bdad95b3d611b905ecdd047b0165ca3905db0d861e76bce8f3a8046e64379e81f54865f7c41b47e57cec887e5912062211bc9010afea8ab12',
              'modifiedIndex': 7,
              'createdIndex': 7
            }],
          'modifiedIndex': 8,
          'createdIndex': 8
        }
      });


    nock(etcdHosts)
      .put('/v2/keys/users/new_user/passwd?prevExist=true', { 'value': '055ce1d842cf891d62d2bbedfbdcd3e1a9421ac94f4109fc01e11bd99b029671358bd0a871c7857d2ac01aa528c2504a05bcfc190205cc164d8f4c05cc5808e4' })
      .reply(200, {
        'action': 'update',
        'node': {
          'key': '/users/new_user/passwd',
          'value': '055ce1d842cf891d62d2bbedfbdcd3e1a9421ac94f4109fc01e11bd99b029671358bd0a871c7857d2ac01aa528c2504a05bcfc190205cc164d8f4c05cc5808e4',
          'modifiedIndex': 9,
          'createdIndex': 9
        },
        'prevNode': {
          'key': '/users/new_user/passwd',
          'value': '8507b5d862306d5bdad95b3d611b905ecdd047b0165ca3905db0d861e76bce8f3a8046e64379e81f54865f7c41b47e57cec887e5912062211bc9010afea8ab12',
          'modifiedIndex': 10,
          'createdIndex': 10
        }
      });

      nock(etcdHosts)
      .put('/v2/keys/users/new_user/admin', { 'value': 'false' })
      .reply(200, {
        'action':'update',
        'node':{
          'key':'/users/new_user/admin',
          'value':'false',
          'modifiedIndex':11,
          'createdIndex':11
        },
        'prevNode':{
          'key':'/users/new_user/admin',
          'value':'true',
          'modifiedIndex':12,
          'createdIndex':12
        }
      });

  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): update user password.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'new_user', 'password': 'abcdef', 'admin': true, 'modify': true })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update successfully');
        done();
      });
  });

  //
  // Positive cases
  //

  it('Case 2 (Positive): update user set admin=false.', (done) => {
    global.chai.request(global.server)
      .put('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(newUserTemplate, { 'username': 'new_user', 'password': 'abcdef', 'admin': false, 'modify': true })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(201);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('update successfully');
        done();
      });
  });

});

describe('delete user : delete /api/v1/user', () => {
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
  // Negative cases
  //

  it('Case 1 (Negative): Can not delete admin user', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_admin_user'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('remove failed');
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 2 (Negative): Can not delete non-exist user.', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_non_exist_user'})))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(500);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('remove failed');
        done();
      });
  });

  //
  // Positive cases
  //

  it('Case 3 (Positive): delete exist non-admin user.1234', (done) => {
    global.chai.request(global.server)
      .delete('/api/v1/user')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(deleteUserTemplate, { 'username': 'delete_non_admin_user' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(204);
        done();
      });
  });

});
