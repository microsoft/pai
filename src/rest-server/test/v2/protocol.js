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
const protocolSchema = require('../../src/config/v2/protocol');
const protocolMiddleware = require('../../src/middlewares/v2/protocol');


const validProtocolJSONs = {
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
          'minSucceededTaskCount': 1,
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
          'minSucceededTaskCount': 1,
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
      minSucceededTaskCount: 1
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
      minSucceededTaskCount: 1
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
      minSucceededTaskCount: 1
    dockerImage: caffe_example
    resourcePerInstance:
      cpu: 4
      memoryMB: 8192
      gpu: 1
    commands:
      - ./examples/mnist/train_lenet.sh
additionalProp: value
  `,

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
  invalid-name:
    instances: 1
    completion:
      minSucceededTaskCount: 1
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
      minSucceededTaskCount: 1
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
      minSucceededTaskCount: 1
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
      minSucceededTaskCount: 1
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
  it('test protocol schema for valid protocol', (done) => {
    for (let validProtocolYAML of Object.values(validProtocolYAMLs)) {
      const validProtocolJSON = yaml.safeLoad(validProtocolYAML);
      expect(protocolSchema.validate(validProtocolJSON)).to.be.true;
    }
    done();
  });
  it('test protocol schema for invalid protocol', (done) => {
    for (let invalidMessage of Object.keys(invalidProtocolYAMLs)) {
      const invalidProtocolJSON = yaml.safeLoad(invalidProtocolYAMLs[invalidMessage]);
      expect(protocolSchema.validate(invalidProtocolJSON)).to.be.false;
      expect(protocolSchema.validate.errors[0].message).to.equal(invalidMessage);
    }
    done();
  });
  // protocol validation test
  it('test protocol validation for valid protocol', async () => {
    const req = {};
    const res = {};
    for (let validProtocolYAML of Object.values(validProtocolYAMLs)) {
      req.body = {
        protocol: validProtocolYAML,
      };
      await Promise
        .resolve(protocolMiddleware.validate(req, res, () => {}))
        .catch((err) => {
          expect(err).to.be.null;
        });
    }
  });
  it('test protocol validation for invalid protocol', async () => {
    const req = {};
    const res = {};
    for (let invalidMessage of Object.keys(invalidProtocolYAMLs)) {
      req.body = {
        protocol: invalidProtocolYAMLs[invalidMessage],
      };
      await Promise
        .resolve(protocolMiddleware.validate(req, res, () => {}))
        .catch((err) => {
          expect(err.name).to.equal('BadRequestError');
          const errMessage = JSON.parse(err.message);
          if (invalidMessage !== 'should be equal to one of the allowed values') {
            expect(errMessage).to.have.lengthOf(1);
          }
          expect(errMessage[0].message).to.equal(invalidMessage);
        });
    }
  });
  // protocol renderer test
  it('test protocol renderer for valid protocol', async () => {
    const req = {};
    const res = {};
    for (let pname of Object.keys(validProtocolYAMLs)) {
      req.body = {
        protocol: validProtocolYAMLs[pname],
      };
      await Promise
        .resolve(protocolMiddleware.validate(req, res, () => {}))
        .catch((err) => {
          expect(err).to.be.null;
        });
      await Promise
        .resolve(protocolMiddleware.render(req, res, () => {}))
        .catch((err) => {
          expect(err).to.be.null;
        });
      expect(req.body).to.deep.equal({protocol: validProtocolJSONs[pname]});
    }
  });
});
