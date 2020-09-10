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
const nodemailer = require('nodemailer');
const Email = require('email-templates');

const app = express();

app.use(express.json());
app.use(bearerToken());

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_CONFIGS_SMTP_URL.split(':')[0],
  port: process.env.EMAIL_CONFIGS_SMTP_URL.split(':')[1],
  secure: false,
  auth: {
    user: process.env.EMAIL_CONFIGS_SMTP_AUTH_USERNAME,
    pass: process.env.EMAIL_CONFIGS_SMTP_AUTH_PASSWORD,
  },
});

const email = new Email({
  message: {
    from: process.env.EMAIL_CONFIGS_SMTP_FROM,
  },
  send: true,
  transport: transporter,
  views: {
    options: {
      extension: 'ejs',
    },
  },
});

app.post('/alert-handler/stop-job', (req, res) => {
  console.log(
    'alert-handler received `stop-job` post request from alert-manager.',
  );
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
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .send(JSON.stringify({ value: 'STOP' }))
      .end(function (res) {
        console.log(res.raw_body);
      });
  });

  res.status(200).json({
    message: 'alert-handler successfully send stop-job request to rest-server.',
  });
});

const getAlertsGroupedByUser = (alerts, url, token) => {
  const promises = [];
  alerts.map(function (alert) {
    const jobName = alert.labels.job_name;
    if (jobName) {
      promises.push(
        new Promise(function (resolve) {
          return unirest
            .get(`${url}/api/v2/jobs/${jobName}`)
            .headers({
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            })
            .end(function (res) {
              resolve([res.body.jobStatus.username, alert]);
            });
        }),
      );
    }
  });

  const alertsGrouped = {};
  return Promise.all(promises)
    .then(function (values) {
      values.forEach(function (value) {
        const username = value[0];
        const alert = value[1];
        if (username in alertsGrouped) {
          alertsGrouped[username].push(alert);
        } else {
          alertsGrouped[username] = [alert];
        }
      });
      return alertsGrouped;
    })
    .catch(function (data) {
      console.error(data);
    });
};

const getUserEmail = (username, url, token) => {
  return new Promise(function (resolve) {
    return unirest
      .get(`${url}/api/v2/users/${username}`)
      .headers({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      .end(function (res) {
        resolve(res.body.email);
      });
  });
};

app.post('/alert-handler/send-email', async (req, res) => {
  console.log(
    'alert-handler received `send-email` post request from alert-manager.',
  );

  // send email to admin
  email
    .send({
      template: 'general-templates',
      message: {
        to: process.env.EMAIL_CONFIGS_RECEIVER,
      },
      locals: {
        cluster_id: process.env.CLUSTER_ID,
        alerts: req.body.alerts,
        groupLabels: req.body.groupLabels,
        externalURL: req.body.externalURL,
      },
    })
    .then(function (res) {
      console.log('alert-handler successfully send email to admin');
    })
    .catch(console.error);

  // send email to job user when possible
  // group alerts by username
  const url = process.env.REST_SERVER_URI;
  const token = req.token;

  const alertsGrouped = await getAlertsGroupedByUser(
    req.body.alerts,
    url,
    token,
  );

  if (alertsGrouped) {
    // send emails to different users separately
    Object.keys(alertsGrouped).forEach(async (username) => {
      const userEmail = await getUserEmail(username, url, token);
      email.send({
        template: 'general-templates',
        message: {
          to: userEmail,
        },
        locals: {
          cluster_id: process.env.CLUSTER_ID,
          alerts: alertsGrouped[username],
          groupLabels: req.body.groupLabels,
          externalURL: req.body.externalURL,
        },
      });
      console.log(`alert-handler successfully send email to user: ${username}`);
    });
  }

  res.status(200).json({
    message: 'alert-handler successfully sent email',
  });
});

const port = process.env.SERVER_PORT;
app.listen(port, () => {
  console.log(`alert-handler listening at http://localhost:${port}`);
});
