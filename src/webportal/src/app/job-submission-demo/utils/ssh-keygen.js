// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import * as NodeRSA from 'node-rsa';
import * as SSHPk from 'sshpk';

export function generateSSHKeyPair(bits) {
  const key = new NodeRSA({ b: bits });
  const pemPub = key.exportKey('pkcs1-public-pem');
  const pemPri = key.exportKey('pkcs1-private-pem');

  const sshKey = SSHPk.parseKey(pemPub, 'pem');
  sshKey.comment = 'pai-job-ssh';
  const sshPub = sshKey.toString('ssh');
  return { public: sshPub, private: pemPri };
}
