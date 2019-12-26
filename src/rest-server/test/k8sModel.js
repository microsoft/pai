// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const chai = require('chai');
const nockUtils = require('./utils/nock');
const k8sModel = require('@pai/models/kubernetes');

describe('kubernetes model', () => {
  afterEach(function() {
    if (!nock.isDone()) {
      nock.cleanAll();
      throw new Error('Not all nock interceptors were used!');
    }
  });

  it('Case 1 (Positive): encode selector', (done) => {
    const res = k8sModel.encodeSelector({pos1: 1, pos2: 'pos2'}, {neg1: 1, neg2: 'neg2'});
    chai.expect(res).to.equal('pos1=1,pos2=pos2,neg1!=1,neg2!=neg2');
    done();
  });

  it('Case 2 (Positive): create namespace', (done) => {
    const namespace = 'test';
    nock(apiServerRootUri)
      .post(`/api/v1/namespaces/`, {metadata: {name: namespace}})
      .reply(200);
    k8sModel.createNamespace(namespace).then(
      () => done()
    ).catch(
      (err) => done(err)
    );
  });

  it('Case 3 (Positive): get nodes', (done) => {
    const username = 'user';
    const token = nockUtils.registerAdminTokenCheck(username);
    const nodes = {
      kind: 'NodeList',
      apiVersion: 'v1',
      items: [
        {
          metadata: {
            name: 'ip1',
          },
        },
        {
          metadata: {
            name: 'ip2',
          },
        },
      ],
    };
    nock(apiServerRootUri)
      .get('/api/v1/nodes')
      .reply(200, nodes);
    chai.request(global.server)
      .get('/api/v1/kubernetes/nodes')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .end((err, res) => {
        chai.expect(res, 'status code').to.have.status(200);
        chai.expect(res.body).to.be.deep.equal(nodes);
        done();
      });
  });

  it('Case 4 (Positive): get pods', (done) => {
    const username = 'user';
    const token = nockUtils.registerAdminTokenCheck(username);
    const pods = {
      kind: 'PodList',
      apiVersion: 'v1',
      items: [
        {
          metadata: {
            name: 'pod1',
          },
        },
        {
          metadata: {
            name: 'pod2',
          },
        },
      ],
    };
    nock(apiServerRootUri)
      .get('/api/v1/pods')
      .reply(200, pods);
    chai.request(global.server)
      .get('/api/v1/kubernetes/pods')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .end((err, res) => {
        chai.expect(res, 'status code').to.have.status(200);
        chai.expect(res.body).to.be.deep.equal(pods);
        done();
      });
  });
});
