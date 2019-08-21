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
const {protocolConvert} = require('@pai/utils/converter');


const jobConfigs = {
  simple: {
    'jobName': 'simple',
    'image': 'test/image',
    'taskRoles': [
      {
        'name': 'worker',
        'taskNumber': 1,
        'cpuNumber': 1,
        'memoryMB': 1024,
        'gpuNumber': 0,
        'command': 'echo "test"',
      },
    ],
  },

  full: {
    'jobName': 'full',
    'image': 'test/image',
    'dataDir': 'hdfs/data',
    'outputDir': 'hdfs/output',
    'codeDir': 'hdfs/code',
    'taskRoles': [
      {
        'name': 'worker1',
        'taskNumber': 1,
        'cpuNumber': 1,
        'memoryMB': 1024,
        'shmMB': 128,
        'gpuNumber': 0,
        'command': 'echo "test1"',
        'minFailedTaskCount': 1,
        'minSucceededTaskCount': null,
      },
      {
        'name': 'worker2',
        'taskNumber': 2,
        'cpuNumber': 2,
        'memoryMB': 4096,
        'shmMB': 512,
        'gpuNumber': 4,
        'portList': [
          {
            'label': 'ssh',
            'portNumber': 1,
          },
        ],
        'command': 'echo "test2"',
        'minFailedTaskCount': null,
        'minSucceededTaskCount': null,
      },
    ],
    'virtualCluster': 'vc',
    'retryCount': -2,
    'jobEnvs': {
      'env1': 'value1',
      'env2': 'value2',
    },
    'extras': {
      'submitFrom': 'plugin',
    },
  },
};

const protocolYAMLs = {
  simple: `
protocolVersion: '2'
name: simple
type: job
prerequisites:
  - name: default
    type: dockerimage
    uri: test/image
jobRetryCount: 0
taskRoles:
  worker:
    instances: 1
    completion:
      minFailedInstances: 1
      minSucceededInstances: null
    dockerImage: default
    extraContainerOptions:
      shmMB: 64
    resourcePerInstance:
      cpu: 1
      memoryMB: 1024
      gpu: 0
    commands:
      - echo "test"
deployments:
  - name: default
    taskRoles:
      worker:
        preCommands:
          - 'echo "[WARNING] Compatibility mode for v1 job, please use protocol config instead."'
defaults:
  virtualCluster: default
  deployment: default
  `,

  full: `
protocolVersion: '2'
name: full
type: job
prerequisites:
  - name: default
    type: dockerimage
    uri: test/image
  - name: default
    type: data
    uri:
      - hdfs/data
  - name: default
    type: output
    uri: hdfs/output
  - name: default
    type: script
    uri: hdfs/code
jobRetryCount: -2
taskRoles:
  worker1:
    instances: 1
    completion:
      minFailedInstances: 1
      minSucceededInstances: null
    dockerImage: default
    extraContainerOptions:
      shmMB: 128
    resourcePerInstance:
      cpu: 1
      memoryMB: 1024
      gpu: 0
    commands:
      - echo "test1"
    data: default
    output: default
    script: default
  worker2:
    instances: 2
    completion:
      minFailedInstances: null
      minSucceededInstances: null
    dockerImage: default
    extraContainerOptions:
      shmMB: 512
    resourcePerInstance:
      cpu: 2
      memoryMB: 4096
      gpu: 4
      ports:
        ssh: 1
    commands:
      - echo "test2"
    data: default
    output: default
    script: default
deployments:
  - name: default
    taskRoles:
      worker1:
        preCommands:
          - 'echo "[WARNING] Compatibility mode for v1 job, please use protocol config instead."'
          - 'export PAI_DATA_DIR=<% $data.uri[0] %>'
          - export PAI_OUTPUT_DIR=<% $output.uri %>
          - export PAI_CODE_DIR=<% $script.uri %>
          - export env1=value1
          - export env2=value2
      worker2:
        preCommands:
          - 'echo "[WARNING] Compatibility mode for v1 job, please use protocol config instead."'
          - 'export PAI_DATA_DIR=<% $data.uri[0] %>'
          - export PAI_OUTPUT_DIR=<% $output.uri %>
          - export PAI_CODE_DIR=<% $script.uri %>
          - export env1=value1
          - export env2=value2
defaults:
  virtualCluster: vc
  deployment: default
parameters:
  env1: value1
  env2: value2
extras:
  submitFrom: plugin
  `,
};

// unit tests for job config v1 to v2 converter
describe('Converter Unit Tests', () => {
  // converter test
  it('test protocol converter for v1 job configs', async () => {
    for (let [name, jobConfig] of Object.entries(jobConfigs)) {
      const protocolYAML = await protocolConvert(jobConfig);
      expect(protocolYAML.trim()).to.equal(protocolYAMLs[name].trim());
    }
  });
});
