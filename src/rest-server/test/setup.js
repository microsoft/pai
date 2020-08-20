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
process.env.LAUNCHER_TYPE = 'k8s';
process.env.LAUNCHER_RUNTIME_IMAGE = 'openpai/kube-runtime';
process.env.LAUNCHER_RUNTIME_IMAGE_PULL_SECRETS = 'pai-secret';
process.env.LAUNCHER_SCHEDULER = 'hivedscheduler';
process.env.LOG_MANAGER_PORT = 9103;
process.env.JWT_SECRET = 'jwt_test_secret';
process.env.DEFAULT_PAI_ADMIN_USERNAME = 'paiAdmin';
process.env.DEFAULT_PAI_ADMIN_PASSWORD = 'adminis';
process.env.AUTHN_METHOD = 'basic';
process.env.K8S_APISERVER_URI = 'http://kubernetes.test.pai:8080';
process.env.HIVED_WEBSERVICE_URI = 'http://hived.pai:30096';
process.env.RBAC_IN_CLUSTER = 'false';
process.env.DEBUGGING_RESERVATION_SECONDS = '604800';
process.env.HIVED_SPEC_PATH = 'test/data/hivedscheduler.yaml';
process.env.GROUP_CONFIG_PATH = 'test/data/group.yaml';
process.env[env.exitSpecPath] = 'test/data/exit-spec.yaml';
process.env.REST_SERVER_URI = 'http://restserver.test.pai.9186';
process.env.SQL_CONNECTION_STR = 'postgres://localhost:5432/openpai';
process.env.SQL_MAX_CONNECTION = 10;
process.env.WRITE_MERGER_URL = 'http://localhost';

const jwt = require('jsonwebtoken');
const mustache = require('mustache');
const nock = require('nock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
chai.use(chaiAsPromised);


before(function(done) {
  this.timeout(10000);
  require('@pai').then((server) => {
    global.server = server;
    done();
  }).catch((err) => done(err));
});

global.jwt = jwt;
global.mustache = mustache;
global.nock = nock;
global.chai = chai;
global.assert = chai.assert;
global.expect = chai.expect;
global.should = chai.should;
global.apiServerRootUri = process.env.K8S_APISERVER_URI;
