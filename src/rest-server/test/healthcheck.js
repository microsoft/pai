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


// test
describe('API endpoint /api/v1', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  // GET /
  it('should return not found', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        done();
      });
  });

  // GET /api
  it('should return not found', (done) => {
    chai.request(server)
      .get('/api')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(404);
        done();
      });
  });

  // GET /api/v1
  it('should return health check', (done) => {
    chai.request(server)
      .get('/api/v1')
      .end((err, res) => {
        expect(res, 'status code').to.have.status(200);
        expect(res.text, 'response text').to.be.a('string');
        expect(res.text, 'response text').equal('<pre>PAI RESTful API</pre>');
        done();
      });
  });
});