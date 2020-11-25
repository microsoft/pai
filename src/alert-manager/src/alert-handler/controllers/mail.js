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

const axios = require('axios');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const logger = require('@alert-handler/common/logger');
const path = require('path');

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

// OpenPAI handbook troubleshooting
const troubleshootingURL =
  'https://openpai.readthedocs.io/en/latest/manual/cluster-admin/troubleshooting.html';

// send email to admin
const sendEmailToAdmin = (req, res) => {
  logger.info(
    'alert-handler received `send-email-to-admin` post request from alert-manager.',
  );
  const template = req.query.template
    ? req.query.template
    : 'general-templates';
  email
    .send({
      template: path.join('/etc/alerthandler/templates/', template),
      message: {
        to: process.env.EMAIL_CONFIGS_ADMIN_RECEIVER,
      },
      locals: {
        cluster_id: process.env.CLUSTER_ID,
        alerts: req.body.alerts,
        groupLabels: req.body.groupLabels,
        externalURL: req.body.externalURL,
        webportalURL: process.env.WEBPORTAL_URI,
        troubleshootingURL: troubleshootingURL,
      },
    })
    .then(() => {
      logger.info(
        `alert-handler successfully send email to admin at ${process.env.EMAIL_CONFIGS_ADMIN_RECEIVER}`,
      );
      res.status(200).json({
        message: `alert-handler successfully send email to admin at ${process.env.EMAIL_CONFIGS_ADMIN_RECEIVER}`,
      });
    })
    .catch((error) => {
      logger.error('alert-handler failed to send email to admin', error);
      res.status(500).json({
        message: `alert-handler failed to send email to admin`,
      });
    });
};

const getUserNameByJobName = async (jobName, token) => {
  return axios
    .get(`${process.env.REST_SERVER_URI}/api/v2/jobs/${jobName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      return response.data.jobStatus.username;
    });
};

const getUserEmail = async (username, token) => {
  return axios
    .get(`${process.env.REST_SERVER_URI}/api/v2/users/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      return response.data.email;
    });
};

// send email to job user
const sendEmailToUser = async (req, res) => {
  logger.info(
    'alert-handler received `send-email-to-user` post request from alert-manager.',
  );
  // filter alerts which are firing and contain `job_name` as label
  const alerts = req.body.alerts.filter(
    (alert) => alert.status === 'firing' && 'job_name' in alert.labels,
  );
  if (alerts.length === 0) {
    return res.status(200).json({
      message: 'No alert need to be send to users.',
    });
  }

  // group alerts by username
  const alertsGrouped = {};
  alerts.map((alert, index) => {
    let userName = alert.labels.job_name.split('~')[0];
    if (userName in alertsGrouped) {
      alertsGrouped[userName].push(alerts[index]);
    } else {
      alertsGrouped[userName] = [alerts[index]];
    }
  });

  const template = req.query.template
    ? req.query.template
    : 'general-templates';
  if (alertsGrouped) {
    // send emails to different users separately
    Promise.all(
      Object.keys(alertsGrouped).map(async (username) => {
        const userEmail = await getUserEmail(username, req.token);
        if (userEmail) {
          email.send({
            template: path.join('/etc/alerthandler/templates/', template),
            message: {
              to: userEmail,
            },
            locals: {
              cluster_id: process.env.CLUSTER_ID,
              alerts: alertsGrouped[username],
              groupLabels: req.body.groupLabels,
              externalURL: req.body.externalURL,
              webportalURL: process.env.WEBPORTAL_URI,
              troubleshootingURL: troubleshootingURL,
            },
          });
        } else {
          logger.info(`User ${username} has no email configured`);
        }
      }),
    )
      .then((response) => {
        logger.info('alert-handler successfully send emails to users');
        res.status(200).json({
          message: `alert-handler successfully send emails to users`,
        });
      })
      .catch((error) => {
        logger.error(error);
        res.status(500).json({
          message: `alert-handler failed to send email to users`,
        });
      });
  }
};

// module exports
module.exports = {
  sendEmailToAdmin,
  sendEmailToUser,
};
