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

    // mock for case 1 username=tokentest
    nock(apiServerRootUri)
      .get('/api/v1/namespaces/pai-user/secrets/746f6b656e74657374')
      .reply(200, {
        'kind': 'Secret',
        'apiVersion': 'v1',
        'metadata': {
            'name': '746f6b656e74657374',
        },
        'data': {
            'admin': 'ZmFsc2U=',
            'password': 'MzdhM2Q3NzViZGYzYzhiZDZjY2Y0OTRiNzZkMjk3ZjZhNWNlNDhlNmY5Yjg1MjZlMDVlZmVlYjY0NDY4OTc2OGEwZTlmZjc0NmE2NDM1NTM4YjllN2M5MDM5Y2IxMzlkYTM3OWU0NWU3ZTdlODUzOTA2ZmE2YTc5MGUwOTRmNzI=',
            'username': 'dG9rZW50ZXN0',
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

  it('Case 1 (Positive): Return valid token with right username and password.', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/token')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'tokentest', 'password': '123456' })))
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
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'tokentest', 'password': 'abcdef' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('IncorrectPasswordError');
        done();
      });
  });

  it('Case 3 (Negative): Should authenticate failed with non-exist user', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/token')
      .set('Authorization', 'Bearer ' + validToken)
      .send(JSON.parse(global.mustache.render(getTokenTemplate, { 'username': 'nonexist', 'password': 'abcdef' })))
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });

});
