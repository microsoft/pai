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
'use strict';


// module dependencies
const status = require('statuses');
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const job = require('@pai/models/v2/job');
const logger = require('@pai/config/logger');
const createError = require('@pai/utils/error');
const axios = require('@pai/utils/non-strict-axios');
const yarnConfig = require('@pai/config/yarn');
const config = require('@pai/config/index');

const get = asyncHandler(async (req, res) => {
  const data = await job.getJobsByGroupId(req.params.groupId, req.query);
  res.json(data);
});

const executeJobsByGroupId = asyncHandler(async (req, res) => {
    const userName = req.user.username;
    const admin = req.user.admin;
    const groupId = req.params.groupId;
    let response;
    try {
        response = await axios({
            method: 'delete',
            url: yarnConfig.yarnAppGroupPath(groupId),
            headers: yarnConfig.getRequestHeaders(),
            params: {
                'user.name': `${userName}`,
            },
            timeout: 30000,
        });
    } catch (error) {
        if (error.response != null) {
            response = error.response;
        } else {
            if (!config.enableGroupIdCompatibility) {
                throw error;
            } else {
                logger.info(`error: ${error}`);
                return;
            }
        }
    }
    if (response.status === status('Not Found')) {
        if (!config.enableGroupIdCompatibility) {
            throw createError(response.status, 'NoJobError', response.data.message);
        } else {
            logger.info(`error: ${response.data.message}`);
            return;
        }
    } else if (response.status !== status('OK') && response.status !== status('Accepted')) {
        if (!config.enableGroupIdCompatibility) {
            throw createError(response.status, 'UnknownError', response.data.message);
        } else {
            logger.info(`error: ${response.data.message}`);
            return;
        }
    }

    let prohibitApps = [];

    if (config.enableGroupIdCompatibility) {
        let apps = await job.getJobsByGroupId(groupId, {});

        if (apps.apps.length === 0) {
            throw createError('Not Found', 'NoJobError', `Job group ${groupId} is not found.`);
        }

        // kill JOBWRAPPER job firstly
        for (const app of apps.apps) {
            if (app.jobType === 'JOBWRAPPER') {
                try {
                    const allowedStop = await checkStopAllowed(app, admin, userName);
                    if (!allowedStop) {
                        prohibitApps.push(app.appId);
                        continue;
                    }
                    await job.executeJobByJobName(app.name, req.body.value, userName);
                    logger.info(`[Execute Job By Type] ${userName} ${req.body.value} ${app.name} appid ${app.appId} accepted.`);
                } catch (error) {
                    logger.info(`fail to do operation ${req.body.value} for job ${app.jobName} error: ${error}`);
                }
            }
        }

        for (const app of apps.apps) {
            try {
                if (app.jobType === 'LAUNCHER') {
                    const allowedStop = await checkStopAllowed(app, admin, userName);
                    if (!allowedStop) {
                        prohibitApps.push(app.appId);
                        continue;
                    }
                    await job.executeJobByJobName(app.name, req.body.value, userName);
                    logger.info(`[Execute Job] ${userName} ${req.body.value} ${app.name} appid ${app.appId}  accepted.`);
                } else if (app.jobType === 'SPARK') {
                    const allowedStop = await checkStopAllowed(app, admin, userName);
                    if (!allowedStop) {
                        prohibitApps.push(app.appId);
                        continue;
                    }
                    await job.executeJobByAppId(app.appId, req.body.value, userName);
                    logger.info(`[Execute Job] ${userName} ${req.body.value} ${app.name} appid ${app.appId}  accepted.`);
                }
            } catch (error) {
                logger.info(`fail to do operation ${req.body.value} for job ${app.name} appid ${app.appId} error: ${error}`);
            }
        }
    }

    if (prohibitApps.length === 0) {
        res.status(status('Accepted')).json({
            status: status('Accepted'),
            message: `Execute job group (${req.body.value}) ${req.params.groupId} accepted, will stop the job shortly.`,
        });
    } else {
        let appidStr = prohibitApps.join();
        res.status(status('Bad Request')).json({
            status: status('Bad Request'),
            message: `Execute job group (${req.body.value}) ${req.params.groupId} partially accepted will stop the job shortly,  but apps ${appidStr} will skip as no permision.`,
        });
    }
});

const checkStopAllowed = async (app, admin, userName) => {
  let queueAclInfoRes = await job.getQueueAcl(app.virtualCluster, userName, 'ADMINISTER_QUEUE');
  let allowedStop = true;
  logger.info(JSON.stringify(queueAclInfoRes));
  if ((job.username !== userName) && !admin) {
    allowedStop = false;
    if (queueAclInfoRes.allowed && queueAclInfoRes.allowed === 'true') {
      allowedStop = true;
    }
  }
  return allowedStop;
};

// module exports
module.exports = {
  get,
  executeJobsByGroupId,
};
