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


// module dependencies
const unirest = require('unirest');
const config = require('@pai/config/index');
const logger = require('@pai/config/logger');
const yarnConfig = require('@pai/config/yarn');
const launcherConfig = require('@pai/config/launcher');

if (launcherConfig.type === 'yarn') {
  if (config.env !== 'test') {
    // framework launcher health check
    unirest.get(launcherConfig.healthCheckPath())
    .timeout(2000)
    .end((res) => {
      if (res.status === 200) {
        logger.info('connected to framework launcher successfully');
      } else {
        throw new Error('cannot connect to framework launcher');
      }
    });
    // hadoop yarn health check
    unirest.get(yarnConfig.yarnVcInfoPath)
    .timeout(2000)
    .end((res) => {
      if (res.status === 200) {
        logger.info('connected to yarn successfully');
      } else {
        throw new Error('cannot connect to yarn');
      }
    });
  }
  module.exports = require('@pai/models/v1/job/yarn');
}
