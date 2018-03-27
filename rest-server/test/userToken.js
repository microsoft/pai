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
  beforeEach(() => {

    nock(etcdHosts)
      .get('/v2/keys/users/new_user?recursive=true')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/users/new_user',
          'dir': true,
          'nodes':
            [{
              'key': '/users/new_user/admin',
              'value': 'true',
              'modifiedIndex': 1,
              'createdIndex': 1
            }, {
              'key': '/users/new_user/passwd',
              'value': '8507b5d862306d5bdad95b3d611b905ecdd047b0165ca3905db0d861e76bce8f3a8046e64379e81f54865f7c41b47e57cec887e5912062211bc9010afea8ab12',
              'modifiedIndex': 2,
              'createdIndex': 2
            }],
          'modifiedIndex': 3,
          'createdIndex': 3
        }
      });


  });

  //
  // Positive cases
  //

  it('Case 1 (Positive): The admin username and password is right, return right token .', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/token')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'new_user', 'password': '123456' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 2 (Negative): wrong password, authentication failed', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/token')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'new_user', 'password': 'abcdef' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.message, 'response message').equal('authentication failed');
        done();
      });
  });

});

