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

const unirest = require('unirest');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const logger = require('@alert-handler/common/logger');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_CONFIGS_SMTP_HOST,
  port: parseInt(process.env.EMAIL_CONFIGS_SMTP_PORT),
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

const getAlertsGroupedByUser = (alerts, url, token) => {
  // create promise group
  const promises = [];
  alerts.map(function (alert) {
    const jobName = alert.labels.job_name;
    if (jobName) {
      promises.push(
        new Promise(function (resolve, reject) {
          return unirest
            .get(`${url}/api/v2/jobs/${jobName}`)
            .headers({
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            })
            .end(function (res) {
              if (!res.ok) {
                logger.error(
                  'alert-handler failed to get username with jobname.',
                );
                logger.error(res.raw_body);
                reject(
                  new Error(
                    'alert-handler failed to get username with jobname.',
                  ),
                );
              } else {
                resolve([res.body.jobStatus.username, alert]);
              }
            });
        }),
      );
    }
  });

  // group alerts by username
  const alertsGrouped = {};
  return (
    Promise.all(promises)
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
      // catch ?
      .catch(function (error) {
        return error;
      })
  );
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

const sendEmailToAdmin = async (req, res) => {
  // send email to admin
  email
    .send({
      template: 'general-templates',
      message: {
        to: process.env.EMAIL_CONFIGS_ADMIN_RECEIVER,
      },
      locals: {
        cluster_id: process.env.CLUSTER_ID,
        alerts: req.body.alerts,
        groupLabels: req.body.groupLabels,
        externalURL: req.body.externalURL,
      },
    })
    .then(function () {
      logger.info(
        `alert-handler successfully send email to admin at ${process.env.EMAIL_CONFIGS_ADMIN_RECEIVER}`,
      );
      res.status(200).json({
        message: `alert-handler successfully send email to admin at ${process.env.EMAIL_CONFIGS_ADMIN_RECEIVER}`,
      });
    })
    .catch(function (data) {
      logger.error('alert-handler failed to send email to admin');
      logger.error(data);
      res.status(500).json({
        message: `alert-handler failed to send email to admin`,
      });
    });
};

const sendEmailToUser = async (req, res) => {
  // send email to job user
  // group alerts by username
  const url = process.env.REST_SERVER_URI;
  const token = req.token;
  let alertsGrouped;

  try {
    alertsGrouped = await getAlertsGroupedByUser(req.body.alerts, url, token);
  } catch (data) {
    logger.error(data);
    res.status(500).json({
      message: `Send email encourted Unknown Error`,
    });
  }

  if (alertsGrouped) {
    // send emails to different users separately
    Object.keys(alertsGrouped).forEach(async (username) => {
      const userEmail = await getUserEmail(username, url, token);
      email
        .send({
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
        })
        .then(function () {
          logger.info(
            `alert-handler successfully send email to ${username} at ${userEmail}`,
          );
        })
        .catch(function (data) {
          logger.error('alert-handler failed to send email to user');
          logger.error(data);
          res.status(500).json({
            message: 'alert-handler failed to send email to user',
          });
        });
    });

    res.status(200).json({
      message: `alert-handler successfully send email to users`,
    });
  }
};

// module exports
module.exports = {
  sendEmailToAdmin,
  sendEmailToUser,
};
