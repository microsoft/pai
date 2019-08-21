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
const yaml = require('js-yaml');
const protocolSchema = require('@pai/config/v2/protocol');
const protocolMiddleware = require('@pai/middlewares/v2/protocol');


const validprotocolObjs = {
  caffe_mnist: {
    'protocolVersion': 2,
    'name': 'caffe_mnist',
    'type': 'job',
    'version': '1.0',
    'contributor': 'OpenPAI',
    'prerequisites': {
      'data': {},
      'output': {},
      'script': {},
      'dockerimage': {
        'caffe_example': {
          'protocolVersion': 2,
          'name': 'caffe_example',
          'type': 'dockerimage',
          'version': '1.0',
          'contributor': 'OpenPAI',
          'description': 'caffe',
          'uri': 'openpai/pai.example.caffe',
        },
      },
    },
    'taskRoles': {
      'train': {
        'instances': 1,
        'completion': {
          'minSucceededInstances': 1,
        },
        'dockerImage': 'caffe_example',
        'resourcePerInstance': {
          'cpu': 4,
          'memoryMB': 8192,
          'gpu': 1,
        },
        'commands': [
          './examples/mnist/train_lenet.sh',
        ],
        'entrypoint': './data/mnist/get_mnist.sh && ./examples/mnist/create_mnist.sh && ./examples/mnist/train_lenet.sh',
      },
    },
    'deployments': {
      'caffe_example': {
        'name': 'caffe_example',
        'taskRoles': {
          'train': {
            'preCommands': [
              './data/mnist/get_mnist.sh',
              './examples/mnist/create_mnist.sh',
            ],
          },
        },
      },
    },
    'defaults': {
      'deployment': 'caffe_example',
    },
  },

  pytorch_mnist: {
    'protocolVersion': 2,
    'name': 'pytorch_mnist',
    'type': 'job',
    'version': '1.0.0',
    'contributor': 'OpenPAI',
    'description': 'image classification, mnist dataset, pytorch',
    'parameters': {
      'epochs': 10,
      'batchsize': 32,
      'lr': 0.01,
    },
    'prerequisites': {
      'data': {},
      'output': {},
      'script': {
        'pytorch_example': {
          'protocolVersion': 2,
          'name': 'pytorch_example',
          'type': 'script',
          'version': '1.0.0',
          'contributor': 'OpenPAI',
          'uri': 'ftp://pytorch_examples',
        },
      },
      'dockerimage': {
        'pytorch_example': {
          'protocolVersion': 2,
          'name': 'pytorch_example',
          'type': 'dockerimage',
          'version': '1.0.0',
          'contributor': 'OpenPAI',
          'description': 'python3.5, pytorch',
          'uri': 'openpai/pai.example.pytorch',
        },
      },
    },
    'taskRoles': {
      'worker': {
        'instances': 1,
        'completion': {
          'minSucceededInstances': 1,
        },
        'dockerImage': 'pytorch_example',
        'script': 'pytorch_example',
        'resourcePerInstance': {
          'cpu': 4,
          'memoryMB': 8192,
          'gpu': 1,
        },
        'commands': [
          'python <% $script.name %>/mnist/main.py --epochs <% $parameters.epochs %> --lr <% $parameters.lr %> --batch-size <% $parameters.batchsize %>\n',
        ],
        'entrypoint': 'python pytorch_example/mnist/main.py --epochs 10 --lr 0.01 --batch-size 32',
      },
    },
    'deployments': {},
  },

  secret_example: {
    'protocolVersion': 2,
    'name': 'secret_example',
    'type': 'job',
    'version': '1.0',
    'contributor': 'OpenPAI',
    'secrets': {
      'registry': {
        'username': 'testuser',
        'password': 'testpass',
      },
    },
    'prerequisites': {
      'data': {},
      'output': {},
      'script': {},
      'dockerimage': {
        'secret_example': {
          'protocolVersion': 2,
          'name': 'secret_example',
          'type': 'dockerimage',
          'version': '1.0',
          'contributor': 'OpenPAI',
          'description': 'caffe',
          'auth': {
            'username': 'testuser',
            'password': 'testpass',
            'registryuri': 'docker.io',
          },
          'uri': 'openpai/pai.example.caffe',
        },
      },
    },
    'taskRoles': {
      'train': {
        'instances': 1,
        'completion': {
          'minSucceededInstances': 1,
        },
        'dockerImage': 'secret_example',
        'resourcePerInstance': {
          'cpu': 4,
          'memoryMB': 8192,
          'gpu': 1,
        },
        'commands': [
          'exit',
        ],
        'entrypoint': 'exit',
      },
    },
    'deployments': {},
  },
};

const validProtocolYAMLs = {
  caffe_mnist: `
protocolVersion: 2
name: caffe_mnist
type: job
version: !!str 1.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: !!str 1.0
    contributor: OpenPAI
    description: caffe
    uri : openpai/pai.example.caffe
taskRoles:
  train:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: caffe_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - ./examples/mnist/train_lenet.sh
deployments:
  - name: caffe_example
    taskRoles:
      train:
        preCommands:
          - ./data/mnist/get_mnist.sh
          - ./examples/mnist/create_mnist.sh
defaults:
  deployment: caffe_example
  `,

  pytorch_mnist: `
protocolVersion: 2
name: pytorch_mnist
type: job
version: 1.0.0
contributor: OpenPAI
description: image classification, mnist dataset, pytorch
parameters:
  epochs: 10
  batchsize: 32
  lr: 0.01
prerequisites:
  - protocolVersion: 2
    name: pytorch_example
    type: dockerimage
    version: 1.0.0
    contributor : OpenPAI
    description: python3.5, pytorch
    uri : openpai/pai.example.pytorch
  - protocolVersion: 2
    name: pytorch_example
    type: script
    version: 1.0.0
    contributor : OpenPAI
    uri : ftp://pytorch_examples
taskRoles:
  worker:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: pytorch_example
    script: pytorch_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - >
        python <% $script.name %>/mnist/main.py
        --epochs <% $parameters.epochs %>
        --lr <% $parameters.lr %>
        --batch-size <% $parameters.batchsize %>
  `,

  secret_example: `
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
};

const invalidProtocolYAMLs = {
  'should NOT have additional properties': `
protocolVersion: 2
name: caffe_mnist
type: job
version: 1.0.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: 1.0.0
    contributor: OpenPAI
    description: caffe
    uri: openpai/pai.example.caffe
taskRoles:
  valid_name:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: caffe_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - ./examples/mnist/train_lenet.sh
additionalProp: value
  `,

  '*should NOT have additional properties': `
protocolVersion: 2
name: caffe_mnist
type: job
version: 1.0.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: 1.0.0
    contributor: OpenPAI
    description: caffe
    uri: openpai/pai.example.caffe
taskRoles:
  invalid-name:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: caffe_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - ./examples/mnist/train_lenet.sh
  `,

  'should have required property \'taskRoles\'': `
protocolVersion: 2
name: caffe_mnist
type: job
version: 1.0.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: 1.0.0
    contributor : OpenPAI
    description: caffe
    uri: openpai/pai.example.caffe
  `,

  'should have required property \'name\'': `
protocolVersion: 2
type: job
version: 1.0.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: 1.0.0
    contributor : OpenPAI
    description: caffe
    uri: openpai/pai.example.caffe
taskRoles:
  valid_name:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: caffe_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - ./examples/mnist/train_lenet.sh
  `,

  'should have required property \'gpu\'': `
protocolVersion: 2
name: caffe_example
type: job
version: 1.0.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: 1.0.0
    contributor : OpenPAI
    description: caffe
    uri: openpai/pai.example.caffe
taskRoles:
  valid_name:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: caffe_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
    commands:
      - ./examples/mnist/train_lenet.sh
  `,

  'should have required property \'commands\'': `
protocolVersion: 2
name: caffe_example
type: job
version: 1.0.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: 1.0.0
    contributor : OpenPAI
    description: caffe
    uri: openpai/pai.example.caffe
taskRoles:
  valid_name:
    instances: 1
    completion:
      minSucceededInstances: 1
    dockerImage: caffe_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
  `,

  'should be equal to one of the allowed values': `
protocolVersion: 2
name: caffe_mnist
type: job
version: 1.0.0
contributor: OpenPAI
prerequisites:
  - protocolVersion: 2
    name: caffe_example
    type: dockerimage
    version: 1.0.0
    contributor : OpenPAI
    description: caffe
  `,
};

// unit tests for protocol in API v2
describe('API v2 Unit Tests: protocol', () => {
  // protocol schema test
  it('test protocol schema for valid protocol', () => {
    for (let validProtocolYAML of Object.values(validProtocolYAMLs)) {
      const validprotocolObj = yaml.safeLoad(validProtocolYAML);
      expect(protocolSchema.validate(validprotocolObj)).to.be.true;
    }
  });
  it('test protocol schema for invalid protocol', () => {
    for (let invalidMessage of Object.keys(invalidProtocolYAMLs)) {
      const invalidprotocolObj = yaml.safeLoad(invalidProtocolYAMLs[invalidMessage]);
      if (invalidMessage[0] === '*') {
        invalidMessage = invalidMessage.slice(1);
      }
      expect(protocolSchema.validate(invalidprotocolObj)).to.be.false;
      expect(protocolSchema.validate.errors[0].message).to.equal(invalidMessage);
    }
  });
  // protocol validation test
  it('test protocol validation for valid protocol', () => {
    for (let validProtocolYAML of Object.values(validProtocolYAMLs)) {
      protocolMiddleware.validate(validProtocolYAML);
    }
  });
  it('test protocol validation for invalid protocol', () => {
    for (let invalidMessage of Object.keys(invalidProtocolYAMLs)) {
      try {
        protocolMiddleware.validate(invalidProtocolYAMLs[invalidMessage]);
        throw new Error('Failed test.');
      } catch (err) {
        expect(err.name).to.equal('BadRequestError');
        const errMessage = JSON.parse(err.message);
        if (invalidMessage !== 'should be equal to one of the allowed values') {
          expect(errMessage).to.have.lengthOf(1);
        }
        if (invalidMessage[0] === '*') {
          invalidMessage = invalidMessage.slice(1);
        }
        expect(errMessage[0].message).to.equal(invalidMessage);
      }
    }
  });
  // protocol renderer test
  it('test protocol renderer for valid protocol', () => {
    for (let pname of Object.keys(validProtocolYAMLs)) {
      let protocolObj = validProtocolYAMLs[pname];
      protocolObj = protocolMiddleware.validate(protocolObj);
      protocolObj = protocolMiddleware.render(protocolObj);
      expect(protocolObj).to.deep.equal(validprotocolObjs[pname]);
    }
  });
});
