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

const chai = require('chai');
const jwt = require('jsonwebtoken');
const nockUtils = require('./utils/nock');

describe('basic login test: post /api/v1/authn/basic/login', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('Case 1 (Positive): Return valid token with right username and password (token list is empty)', (done) => {
    const username = 'tokentest';
    const password = '123456';
    // get user
    nockUtils.registerUser({username, password});
    // get token
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-user-token/secrets/${Buffer.from(username).toString('hex')}`)
      .reply(404, {code: 404, reason: 'NotFound'});
    // post token
    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user-token/secrets/')
      .reply(200);

    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .send({username, password})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  it('Case 2 (Positive): Return valid token with right username and password (token list is not empty)', (done) => {
    const username = 'tokentest';
    const password = '123456';
    // get user
    nockUtils.registerUser({username, password});
    // get token
    const token = jwt.sign({username}, process.env.JWT_SECRET, {expiresIn: 60});
    nockUtils.registerToken(username, [token]);
    // replace token
    nock(apiServerRootUri)
      .put(`/api/v1/namespaces/pai-user-token/secrets/${Buffer.from(username).toString('hex')}`)
      .reply(200);

    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .send({username, password})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(200);
        global.chai.expect(res, 'response format').be.json;
        done();
      });
  });

  //
  // Negative cases
  //

  it('Case 3 (Negative): Should authenticate failed with wrong password', (done) => {
    const username = 'tokentest';
    const password = '123456';
    // get user
    nockUtils.registerUser({username, password});

    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .send({username, password: 'wrong_password'})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('IncorrectPasswordError');
        done();
      });
  });

  it('Case 4 (Negative): Should authenticate failed with non-exist user', (done) => {
    global.chai.request(global.server)
      .post('/api/v1/authn/basic/login')
      .send({username: 'nonexist', password: 'abcdef'})
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(400);
        global.chai.expect(res, 'response format').be.json;
        global.chai.expect(res.body.code, 'response code').equal('NoUserError');
        done();
      });
  });
});

describe('token check middleware', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('Negative: Should authenticate failed with a malformed token', (done) => {
    const token = jwt.sign({username: 'asd'}, 'malformed');
    global.chai.request(global.server)
      .get('/api/v2/user')
      .set('Authorization', 'Bearer ' + token)
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res.body.code, 'response code').equal('UnauthorizedUserError');
        global.chai.expect(res.body.message, 'response message').equal('Your token is invalid.');
        done();
      });
  });

  it('Negative: Should authenticate failed with an expired token', (done) => {
    const token = nockUtils.registerAdminTokenCheck('admin', {expiresIn: '1ms'});
    global.chai.request(global.server)
      .get('/api/v2/user')
      .set('Authorization', 'Bearer ' + token)
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res.body.code, 'response code').equal('UnauthorizedUserError');
        global.chai.expect(res.body.message, 'response message').equal('Your token is invalid.');
        done();
      });
    nock.cleanAll();
  });

  it('Negative: Should authenticate failed with a revoked token', (done) => {
    const username = 'admin';
    const token = jwt.sign({username}, process.env.JWT_SECRET, {expiresIn: 60});
    // get token
    const token2 = jwt.sign({username}, process.env.JWT_SECRET, {expiresIn: 60});
    nockUtils.registerToken(username, [token2]);
    global.chai.request(global.server)
      .get('/api/v2/user')
      .set('Authorization', 'Bearer ' + token)
      .send()
      .end((err, res) => {
        global.chai.expect(res, 'status code').to.have.status(401);
        global.chai.expect(res.body.code, 'response code').equal('UnauthorizedUserError');
        global.chai.expect(res.body.message, 'response message').equal('Your token is invalid.');
        done();
      });
  });
});

describe('application token', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('Positive: Create an application token', (done) => {
    const username = 'user';
    const token = nockUtils.registerUserTokenCheck(username);
    // empty token list
    nock(apiServerRootUri)
      .get(`/api/v1/namespaces/pai-user-token/secrets/${Buffer.from(username).toString('hex')}`)
      .reply(404, {code: 404, reason: 'NotFound'});
    // create token info
    nock(apiServerRootUri)
      .post('/api/v1/namespaces/pai-user-token/secrets/')
      .reply(200);
    chai.request(global.server)
      .post('/api/v1/token/application')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .end((err, res) => {
        chai.expect(res, 'status code').to.have.status(200);
        chai.expect(res.body.token, 'token').to.be.a('string');
        chai.expect(res.body.application, 'application flag').to.be.true;
        done();
      });
  });

  it('Negative: Should not create a token with an application token (permission)', (done) => {
    const token = nockUtils.registerUserTokenCheck('app', {application: true});
    chai.request(global.server)
      .post('/api/v1/token/application')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .end((err, res) => {
        chai.expect(res, 'status code').to.have.status(403);
        global.chai.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        global.chai.expect(res.body.message, 'response message').equal('Applications are not allowed to do this operation.');
        done();
      });
  });

  it('Positive: Revoke a token', (done) => {
    const username = 'user';
    const authToken = nockUtils.registerUserTokenCheck(username);
    // get
    const token = jwt.sign({username}, process.env.JWT_SECRET, {expiresIn: 60});
    nockUtils.registerToken(username, [token]);
    // delete
    nock(apiServerRootUri)
      .put(`/api/v1/namespaces/pai-user-token/secrets/${Buffer.from(username).toString('hex')}`)
      .reply(200);

    chai.request(global.server)
      .delete(`/api/v1/token/${token}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send()
      .end((err, res) => {
        chai.expect(res, 'status code').to.have.status(200);
        done();
      });
  });

  it('Positive: List tokens', (done) => {
    const username = 'user';
    const token = nockUtils.registerUserTokenCheck(username);
    const token1 = jwt.sign({username}, process.env.JWT_SECRET, {expiresIn: 60});
    const token2 = jwt.sign({username, application: true}, process.env.JWT_SECRET, {expiresIn: 60});
    nockUtils.registerToken(username, [token1, token2]);
    chai.request(global.server)
      .get('/api/v1/token/')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .end((err, res) => {
        chai.expect(res, 'status code').to.have.status(200);
        chai.expect(res.body.tokens, 'token list').to.include(token1);
        chai.expect(res.body.tokens, 'token list').to.include(token2);
        done();
      });
  });
});
