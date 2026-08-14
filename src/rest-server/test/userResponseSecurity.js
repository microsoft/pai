// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License

const nockUtils = require('./utils/nock');
const { sanitizeUser } = require('@pai/utils/userResponse');

const userSecretPath = (username) =>
  `/api/v1/namespaces/pai-user-v2/secrets/${Buffer.from(username).toString('hex')}`;

const userPayloadWithExtension = (username, extension) => {
  const payload = nockUtils.getUserPayload({ username, grouplist: [] });
  payload.data.extension = Buffer.from(JSON.stringify(extension)).toString(
    'base64',
  );
  return payload;
};

describe('user response security', () => {
  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll();
    }
  });

  it('removes confidential fields while preserving safe extension metadata', () => {
    const sanitized = sanitizeUser({
      username: 'alice',
      password: 'hashed-password',
      extension: {
        boundedClusters: {
          remote: {
            uri: 'https://remote.example',
            username: 'alice',
            token: 'raw-token',
          },
        },
        jobSSH: {
          key: 'redaction-test-private-key-placeholder',
          pubKey: 'ssh-rsa public',
        },
        sshKeys: [{ title: 'laptop', value: 'ssh-rsa public-key' }],
        nested: { refreshToken: 'raw-refresh-token', label: 'safe' },
      },
    });

    global.expect(sanitized).to.not.have.property('password');
    global.expect(sanitized.extension.boundedClusters.remote).to.not.have.property(
      'token',
    );
    global.expect(sanitized.extension.boundedClusters.remote.uri).to.equal(
      'https://remote.example',
    );
    global.expect(sanitized.extension.boundedClusters.remote.username).to.equal(
      'alice',
    );
    global.expect(sanitized.extension.jobSSH).to.not.have.property('key');
    global.expect(sanitized.extension.jobSSH.pubKey).to.equal('ssh-rsa public');
    global.expect(sanitized.extension.sshKeys[0].value).to.equal(
      'ssh-rsa public-key',
    );
    global.expect(sanitized.extension.nested).to.not.have.property(
      'refreshToken',
    );
    global.expect(sanitized.extension.nested.label).to.equal('safe');
  });

  it('requires admin for the user list endpoint', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('alice');
    global.chai
      .request(global.server)
      .get('/api/v2/users')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .end((err, res) => {
        global.expect(res, 'status code').to.have.status(403);
        global.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

  it('allows self user reads and redacts the response', (done) => {
    const validToken = nockUtils.registerUserTokenCheck('alice');
    nock(apiServerRootUri)
      .get(userSecretPath('alice'))
      .reply(
        200,
        userPayloadWithExtension('alice', {
          boundedClusters: {
            remote: {
              uri: 'https://remote.example',
              username: 'alice',
              token: 'raw-token',
            },
          },
          jobSSH: { key: 'private-key', pubKey: 'ssh-rsa public' },
          safe: 'metadata',
        }),
      );

    global.chai
      .request(global.server)
      .get('/api/v2/user/alice')
      .set('Authorization', 'Bearer ' + validToken)
      .end((err, res) => {
        global.expect(res, 'status code').to.have.status(200);
        global.expect(res.body).to.not.have.property('password');
        global.expect(res.body.extension.boundedClusters.remote).to.not.have.property(
          'token',
        );
        global.expect(res.body.extension.boundedClusters.remote.uri).to.equal(
          'https://remote.example',
        );
        global.expect(res.body.extension.jobSSH).to.not.have.property('key');
        global.expect(res.body.extension.jobSSH.pubKey).to.equal('ssh-rsa public');
        global.expect(res.body.extension.safe).to.equal('metadata');
        done();
      });
  });

  it('allows admin reads of another user', (done) => {
    const adminToken = nockUtils.registerAdminTokenCheck('adminX');
    nock(apiServerRootUri)
      .get(userSecretPath('bob'))
      .reply(200, userPayloadWithExtension('bob', { safe: 'metadata' }));

    global.chai
      .request(global.server)
      .get('/api/v2/users/bob')
      .set('Authorization', 'Bearer ' + adminToken)
      .end((err, res) => {
        global.expect(res, 'status code').to.have.status(200);
        global.expect(res.body.username).to.equal('bob');
        global.expect(res.body.extension.safe).to.equal('metadata');
        done();
      });
  });

  it('blocks non-admin reads of another user', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('alice');
    global.chai
      .request(global.server)
      .get('/api/v2/users/bob')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .end((err, res) => {
        global.expect(res, 'status code').to.have.status(403);
        global.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });

  it('blocks non-admin password changes for another user', (done) => {
    const nonAdminToken = nockUtils.registerUserTokenCheck('alice');
    global.chai
      .request(global.server)
      .put('/api/v2/user/bob/password')
      .set('Authorization', 'Bearer ' + nonAdminToken)
      .send({ oldPassword: 'default_password', newPassword: 'new_password' })
      .end((err, res) => {
        global.expect(res, 'status code').to.have.status(403);
        global.expect(res.body.code, 'response code').equal('ForbiddenUserError');
        done();
      });
  });
});
