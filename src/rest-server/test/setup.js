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


require('module-alias/register');
const env = require('@pai/utils/env');

process.env.NODE_ENV = 'test';
process.env.SERVER_PORT = 8080;
process.env.LAUNCHER_TYPE = 'yarn';
process.env.HDFS_URI = 'hdfs://hdfs.test.pai:9000';
process.env.WEBHDFS_URI = 'http://hdfs.test.pai:5070';
process.env.LOG_MANAGER_PORT = 9103;
process.env.LAUNCHER_WEBSERVICE_URI = 'http://launcher.test.pai:9086';
process.env.JWT_SECRET = 'jwt_test_secret';
process.env.DEFAULT_PAI_ADMIN_USERNAME = 'paiAdmin';
process.env.DEFAULT_PAI_ADMIN_PASSWORD = 'adminis';
process.env.AUTHN_METHOD = 'basic';
process.env.YARN_URI = 'http://yarn.test.pai:8088';
process.env.K8S_APISERVER_URI = 'http://kubernetes.test.pai:8080';
process.env.AZ_RDMA = 'false';
process.env.RBAC_IN_CLUSTER = 'false';
process.env.DEBUGGING_RESERVATION_SECONDS = '604800';
process.env.GROUP_CONFIG_PATH = 'test/data/group.yaml';
process.env[env.exitSpecPath] = 'test/data/exit-spec.yaml';
process.env.REST_SERVER_URI = 'http://restserver.test.pai.9186';

const jwt = require('jsonwebtoken');
const mustache = require('mustache');
const nock = require('nock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiHttp = require('chai-http');
const server = require('@pai');

chai.use(chaiHttp);
chai.use(chaiAsPromised);


global.jwt = jwt;
global.mustache = mustache;
global.nock = nock;
global.chai = chai;
global.assert = chai.assert;
global.expect = chai.expect;
global.should = chai.should;
global.server = server;
global.webhdfsUri = process.env.WEBHDFS_URI;
global.launcherWebserviceUri = process.env.LAUNCHER_WEBSERVICE_URI;
global.apiServerRootUri = process.env.K8S_APISERVER_URI;
global.yarnUri = process.env.YARN_URI;

global.jobConfigTemplate = JSON.stringify({
  'jobName': '{{{jobName}}}',
  'image': 'aiplatform/pai.run.tensorflow',
  'dataDir': 'hdfs://10.240.0.10:9000/test/data',
  'codeDir': 'hdfs://10.240.0.10:9000/test/code',
  'virtualCluster': '{{{virtualCluster}}}',
  'taskRoles': [
    {
      'name': 'role1',
      'taskNumber': 1,
      'cpuNumber': 2,
      'memoryMB': 16384,
      'gpuNumber': 0,
      'command': 'python hello.py',
    },
  ],
  'retryCount': 0,
  'jobEnvs': {
    'job_parameter1': 'value1',
    'job_parameter2': 'value2',
  },
});

global.frameworkDetailTemplate = JSON.stringify({
  'summarizedFrameworkInfo': {
    'frameworkName': '{{{frameworkName}}}',
    'queue': '{{{queueName}}}',
  },
  'aggregatedFrameworkRequest': {
    'frameworkRequest': {
      'frameworkDescriptor': {
        'user': {
          'name': '{{{userName}}}',
        },
      },
    },
  },
  'aggregatedFrameworkStatus': {
    'frameworkStatus': {
      'frameworkRetryPolicyState': {
        'retriedCount': 0,
        'succeededRetriedCount': 0,
        'transientNormalRetriedCount': 0,
        'transientConflictRetriedCount': 0,
        'nonTransientRetriedCount': 0,
        'unKnownRetriedCount': 0,
      },
      'frameworkState': 'APPLICATION_RUNNING',
      'applicationId': '{{{applicationId}}}',
    },
    'aggregatedTaskRoleStatuses': {
      'role1': {
        'taskRoleStatus': {
          'taskRoleName': 'role1',
        },
        'taskStatuses': {
          'taskRoleName': 'role1',
          'taskStatusArray': [{
            'taskIndex': 0,
            'taskRoleName': 'role1',
            'taskState': 'TASK_COMPLETED',
            'taskRetryPolicyState': {
              'retriedCount': 0,
              'succeededRetriedCount': 0,
              'transientNormalRetriedCount': 0,
              'transientConflictRetriedCount': 0,
              'nonTransientRetriedCount': 0,
              'unKnownRetriedCount': 0,
            },
            'containerId': 'container1',
            'containerExitCode': 1,
            'containerExitDiagnostics': '',
            'containerExitType': 'UNKNOWN',
          }],
        },
      },
    },
  },
});
