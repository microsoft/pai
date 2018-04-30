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

getTokenTemplate = JSON.stringify({
  'username': '{{username}}',
  'password': '{{password}}'
});


//
// Get a valid token that expires in 60 seconds.
//

const validToken = global.jwt.sign({ username: 'test_user', admin: true }, process.env.JWT_SECRET, { expiresIn: 60 });
const invalidToken = '';

describe('user token test: post /api/v1/token', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    nock(etcdHosts)
      .get('/v2/keys/users/token_test_user?recursive=true')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/token_test_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/token_test_user/admin',
              'value': 'true',
              'modifiedIndex': 1,
              'createdIndex': 1
            }, {
              'key': '/users/token_test_user/passwd',
              'value': 'a293c494f64ee6e56dafaf1863c514986e52a807b96b43332724496b17b86f6191ff900d133da06f68f41053f185f1c588a804e2b746d48f0d1546eb82aba472',
              'modifiedIndex': 2,
              'createdIndex': 2
            }],
          'modifiedIndex': 3,
          'createdIndex': 3
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

  it('Case 1 (Positive): Return valid token with right username and password.', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/token')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'token_test_user', 'password': '123456' })))
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
      .post('/api/v1/token')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'token_test_user', 'password': 'abcdef' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('authentication failed');
        done();
      });
  });

  it('Case 3 (Negative): Should authenticate failed with non-exist user', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/token')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'non_exist_user', 'password': 'abcdef' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('authentication failed');
        done();
      });
  });

});

