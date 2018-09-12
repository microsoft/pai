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

// test
const dbUtility = require('../src/util/dbUtil')

const db = dbUtility.getStorageObject('etcd2', {
  'hosts': etcdHosts,
});
describe('etcd2 get function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    // Mock etcd2
    nock(etcdHosts)
      .get('/v2/keys/single_test')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/single_test',
          'value': 'test',
          'modifiedIndex': 1,
          'createdIndex': 1
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/test1?recursive=true')
      .reply(200, {
        'action': 'get',
        'node': {
          'key': '/test1',
          'dir': true,
          'nodes': [
            {
              'key': '/test1/admin',
              'value': 'true',
              'modifiedIndex': 2,
              'createdIndex': 2
            },
            {
              'key': '/test1/passwd',
              'value': '7519213ff7915e05dd97dd0638d9d474055bfbaf4224492036aa79278f7114c21558fd27a37eae527320a48cdb448ab771f5ec1067d1e6be21ea9dc18371b15b',
              'modifiedIndex': 3,
              'createdIndex': 3
            }],
          'modifiedIndex': 4,
          'createdIndex': 4
        }
      });

    nock(etcdHosts)
      .get('/v2/keys/non_exist')
      .reply(200, {
        'errorCode': 100,
        'message': 'Key not found',
        'cause': '/non_exist',
        'index': 5
      });
  });

  // positive test case
  // get exist single key value pair
  it('should return a map [/single_test,test]', (done) => {
    db.get('/single_test', null, (err, res) => {
      expect(res).to.have.all.keys('/single_test');
      expect(res.get('/single_test')).to.be.equal('test');
      done();
    })
  });

  // negative test case
  // get non-exist key
  it('should return null', (done) => {
    db.get('/non_exist', null, (err, res) => {
      expect(res).to.be.equal(null);
      expect(err.errorCode).to.be.equal(100);
      done();
    })
  });

  // positive test case
  // get key value pair recursive
  it('should return kv map in flatten way', (done) => {
    db.get('/test1', { recursive: true }, (err, res) => {
      expect(res).to.have.all.keys('/test1', '/test1/admin', '/test1/passwd');
      expect(res.get('/test1')).to.be.equal(undefined);
      expect(res.get('/test1/admin')).to.be.equal('true');
      expect(res.get('/test1/passwd')).to.be.equal('7519213ff7915e05dd97dd0638d9d474055bfbaf4224492036aa79278f7114c21558fd27a37eae527320a48cdb448ab771f5ec1067d1e6be21ea9dc18371b15b');
      done();
    });
  });

});


describe('etcd2 set function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    // Mock etcd2
    nock(etcdHosts)
      .put('/v2/keys/set_key_test', { 'value': 'set_key_test' })
      .reply(200, {
        'action': 'set',
        'node': {
          'key': '/set_key_test',
          'value': 'set_key_test',
          'modifiedIndex': 6,
          'createdIndex': 6
        }
      });
  });

  // set a key value pair
  it('should set a key value pair', (done) => {
    db.set('/set_key_test', 'set_key_test', null, (err, res) => {
      expect(res).to.nested.include({'node.value':'set_key_test'})
      done();
    })
  });


});

describe('etcd2 delete function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    // Mock etcd2
    nock(etcdHosts)
      .delete('/v2/keys/del_test1')
      .reply(200, {
        'action':'delete',
        'node':{
          'key':'/del_test',
          'modifiedIndex':7,
          'createdIndex':7
        },
        'prevNode':{
          'key':'/del_test',
          'value':'change',
          'modifiedIndex':8,
          'createdIndex':8
        }
      });

    nock(etcdHosts)
    .delete('/v2/keys/del_test2?recursive=true')
    .reply(200, {
      'action':'delete',
      'node':{
        'key':'/del_test2',
        'dir':true,
        'modifiedIndex':9,
        'createdIndex':9
      },
      'prevNode':{
        'key':'/del_test2',
        'dir':true,
        'modifiedIndex':9,
        'createdIndex':9
      }
    });
  });

  // delete single key
  it('should delete key del_test1', (done) => {
    db.delete('/del_test1', null, (err, res) => {
      expect(res).to.nested.include({'action':'delete','node.key':'/del_test'})
      done();
    })
  });

  it('should delete key del_test2 recursively', (done) => {
    db.delete('/del_test2', {recursive: true}, (err, res) => {
      expect(res).to.nested.include({'action':'delete','node.key':'/del_test2','node.dir':true})
      done();
    })
  });
});

describe('etcd2 has function test', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      //TODO: Revamp this file and enable the following error.
      //this.test.error(new Error('Not all nock interceptors were used!'));
      nock.cleanAll();
    }
  });

  beforeEach(() => {

    // Mock etcd2
    nock(etcdHosts)
    .delete('/v2/keys/has_test1')
    .reply(200, {
      'action': 'get',
      'node': {
        'key': '/has_test2',
        'value': 'has_test2',
        'modifiedIndex': 11,
        'createdIndex': 11
      }
    });

    nock(etcdHosts)
      .get('/v2/keys/has_test2')
      .reply(200, {
        'errorCode':100,
        'message':'Key not found',
        'cause':'/test',
        'index':10
      });

  });

  // get exist single key value pair
  it('key exists should return true', (done) => {
    db.has('/has_test1', null, (err, res) => {
      expect(res).to.be.true;
      done();
    });
  });

  // get non-exist single key value pair
  it('key not exist should return false', (done) => {
    db.has('/has_test2', null, (err, res) => {
      expect(res).to.be.false;
      done();
    });
  });
});
