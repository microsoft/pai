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

// module dependencies
const protocolSecret = require('@pai/utils/protocolSecret');

const protocolYAMLs = {
  secrets_example: `
protocolVersion: 2
name: secret_example
type: job
version: !!str 1.0
contributor: OpenPAI
secrets:
  registry:
    username: testuser
    password: testpass
prerequisites:
  - protocolVersion: 2
    name: secret_example
    type: dockerimage
    version: !!str 1.0
    contributor: OpenPAI
    description: caffe
    auth:
      username: <% $secrets.registry.username %>
      password: <% $secrets.registry.password %>
      registryuri: docker.io
    uri : openpai/pai.example.caffe
taskRoles:
  train:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: secret_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - exit
  `,

  secrets_in_the_end: `
protocolVersion: 2
name: secret_example
type: job
prerequisites:
  - name: secret_example
    type: dockerimage
    auth:
      username: testuser
      password: <% $secrets.registry.password %>
      registryuri: docker.io
    uri : openpai/pai.example.caffe
taskRoles:
  train:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: secret_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - exit
secrets:
  password: testpass
  `,
};

const maskYAMLs = {
  secrets_example: `
protocolVersion: 2
name: secret_example
type: job
version: !!str 1.0
contributor: OpenPAI
secrets: "******"
prerequisites:
  - protocolVersion: 2
    name: secret_example
    type: dockerimage
    version: !!str 1.0
    contributor: OpenPAI
    description: caffe
    auth:
      username: <% $secrets.registry.username %>
      password: <% $secrets.registry.password %>
      registryuri: docker.io
    uri : openpai/pai.example.caffe
taskRoles:
  train:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: secret_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - exit
  `,

  secrets_in_the_end: `
protocolVersion: 2
name: secret_example
type: job
prerequisites:
  - name: secret_example
    type: dockerimage
    auth:
      username: testuser
      password: <% $secrets.registry.password %>
      registryuri: docker.io
    uri : openpai/pai.example.caffe
taskRoles:
  train:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: secret_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - exit
secrets: "******"
  `,
};

// unit tests for protocol secrets mask
describe('Protocol secrets mask Unit Tests', () => {
  // protocol secrets mask test
  it('test protocol secrets mask for protocol configs', () => {
    for (let [name, protocolYAML] of Object.entries(protocolYAMLs)) {
      const maskYAML = protocolSecret.mask(protocolYAML);
      expect(maskYAML.trim()).to.equal(maskYAMLs[name].trim());
    }
  });
});
