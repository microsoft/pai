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

/**
 * Implementation of Alert Handler.
 * Init and start server instance.
 */

const express = require('express');
const unirest = require('unirest');
const bearerToken = require('express-bearer-token');

const app = express();

app.use(express.json());
app.use(bearerToken());

app.post('/alert-handler', (req, res) => {
  console.log('alert-handler received post request from alert-manager.');

  // extract jobs to kill
  const jobNames = [];
  req.body.alerts.forEach(function (alert) {
    if (alert.status === 'firing') {
      jobNames.push(alert.labels.job_name);
    }
  });
  console.log(`alert-handler will stop these jobs: ${jobNames}`);

  const url = process.env.REST_SERVER_URI;
  const token = req.token;
  // stop job by sending put request to rest server
  jobNames.forEach(function (jobName) {
    unirest
      .put(`${url}/api/v2/jobs/${jobName}/executionType`)
      .headers({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send(JSON.stringify({ value: 'STOP' }))
      .end(function (res) {
        console.log(res.raw_body);
      });
  });

  res.status(200).json({
    message: 'alert-handler successfully',
  });
});

const port = process.env.SERVER_PORT;
app.listen(port, () => {
  console.log(`alert-handler listening at http://localhost:${port}`);
});
