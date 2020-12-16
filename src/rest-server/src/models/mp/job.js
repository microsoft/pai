'use strict';
const util = require('util');
const createError = require('@pai/utils/error');
const axios = require('@pai/utils/non-strict-axios');
const fsAdaptor = require('@pai/utils/mp-storage');
const getInfoPromise = util.promisify(fsAdaptor.readModuleDataFromFS);
const Hdfs = require('@pai/utils/hdfs');
const job = require('@pai/models/v2/job');
const logger = require('@pai/config/logger');
const config = require('@pai/config');
const launcherConfig = require('@pai/config/launcher');
const marketEnv = require('@pai/config/mp/env-mp');
const uuid = require('uuid/v4');
const subClusterUtil = require('@pai/utils/subCluster');
const jobUtils = require('@pai/utils/jobUtils');
const crypto = require('crypto');

let mpEnvDict = marketEnv.parseIni();

/**
 * check if frameworkName is exist in Launcher, return true if exist
 * @param {string} frameworkName
 *
 * @return {bool} frameworkExist
 */
async function checkFrameworkNameExist(frameworkName) {
    let frameworkNameCheckUrl = launcherConfig.frameworkRequestPath(frameworkName);
    try {
        await axios({
            method: 'get',
            url: frameworkNameCheckUrl,
            headers: launcherConfig.getRequestHeaders(),
        }); // Response code = 200
        return true;
    } catch (err) {
        if (err.response) {
            if (err.response.status === 404) {
                return false;
            } else {
                throw createError.unknown(`Unable to access launcher webservice. Err: ${err.response.data.message}`);
            }
        } else {
            throw createError.unknown(`Unable to access launcher webservice. Err: ${err.message}`);
        }
    }
}

/**
 * Create output folder on HDFS
 * @param  {string} userName
 * @param  {string} frameworkName
 */
async function createHdfsFolder(userName, frameworkName) {
    // create output folder
    const hdfs = new Hdfs(process.env.WEBHDFS_URI);
    try {
        let path = `/${process.env.SUBCLUSTER}/user/${userName}/marketplace/${frameworkName}`;
        logger.debug(`try to create hdfs folder path:${path}`);
        await hdfs.createFolderAsync(path,
            {'user.name': userName, 'permission': '777'},
        );
        logger.debug(`Create hdfs folder path:${path} successfully.`);
    } catch (error) {
        throw createError('Bad Request', 'WebHDFS issue, fail to get output folder', error);
    }
}

async function checkSubmitAllowed(userName, vcName) {
    let allowedSubmit = true;
    if (vcName && userName) {
        let queueAclInfoRes = await job.getQueueAcl(vcName, userName, 'ADMINISTER_QUEUE');
        if (queueAclInfoRes.allowed && queueAclInfoRes.allowed === 'false') {
            allowedSubmit = false;
        }
    }
    return allowedSubmit;
}

// There should be a job context including username, subcluster and maybe some more
class MTJob {
    constructor(jobName, userName, moduleId, groupId) {
        this.jobName = jobName;
        this.userName = userName;
        this.moduleId = moduleId;
        this.groupId = groupId;
        this.serviceFrameworkName = `${config.jobDriverTag}_${jobName}`;
        // construct webportal Link
        let subClusterInfo = subClusterUtil.getCurrentSubClusterInfo();
        if (this.groupId !== null && this.groupId !== '') {
            this.webportalLink = `${config.webportalUri}/job-detail.html?jobName=${this.jobName}&groupId=${this.groupId}&subCluster=${subClusterInfo.subCluster}`;
        } else {
            this.webportalLink = `${config.webportalUri}/job-detail.html?jobName=${this.jobName}&subCluster=${subClusterInfo.subCluster}`;
        }
    }

    static generateGroupId(str) {
        let newGroupId = crypto.createHash('sha256').update(str).digest('hex');
        return newGroupId.substring(0, 7);
    }

    static generateJobName(userName, moduleId) {
        let curTime = new Date();
        let timeStr = [
            curTime.getFullYear(),
            curTime.getMonth() + 1, // get real month
            curTime.getDate(),
            curTime.getHours(),
            curTime.getMinutes(),
            curTime.getSeconds(),
        ].join('-');
        // Reserve old format for readability
        let frameworkId = `${userName}_${moduleId}_${uuid()}_${timeStr}`;
        return frameworkId;
    }

    static create(userName, moduleId, frameworkName, jobGroupId) {
        let jobName = frameworkName || this.generateJobName(userName, moduleId);
        let groupId = jobGroupId || this.generateGroupId(jobName);

        return new MTJob(jobName, userName, moduleId, groupId);
    }

    async getModuleInterface(moduleParams) {
        if ('run' in moduleParams) {
            return moduleParams.run;
        }
        try {
            let infoJson = await getInfoPromise(this.username, this.moduleId);
            return infoJson.info.match(/i=".*?"/).toString().slice(3, -1);
        } catch (err) {
            throw createError.unknown(err);
        }
    }

    async generateCommand(moduleParams) {
        // Fill the moduleInterface and generate cmd
        let filled = '';
        let moduleInterface = await this.getModuleInterface(moduleParams);

        for (let i = 0; i < moduleInterface.length; i++) {
            if (moduleInterface[i] === '(') {
                let temp = '';
                i = i + 1;
                while (i < moduleInterface.length && moduleInterface[i] !== ')') {
                    temp += moduleInterface[i];
                    i = i + 1;
                }
                let vlist = temp.split(':');
                filled += moduleParams[vlist[0]];
            } else if (moduleInterface[i] === '{') {
                let temp = '';
                i = i + 1;
                while (i < moduleInterface.length && moduleInterface[i] !== '}') {
                    temp += moduleInterface[i];
                    i = i + 1;
                }
                let vlist = temp.split(':');
                if (vlist[0]=== 'in') {
                    filled += moduleParams[vlist[2]];
                }
                if (vlist[0] === 'out') {
                    filled += process.env.HDFS_URI + '/user/' + this.userName + '/marketplace/' + this.jobName;
                }
            } else if (moduleInterface[i] === '[' || moduleInterface[i] === ']') {
                continue;
            } else {
                filled += moduleInterface[i];
            }
        }
        filled = filled.replace(/&quot;/g, '"');
        filled = filled.replace(/%+/g, '%%');
        let mtWebportalLink = 'magnetar_9286_' + config.dataCenter;
        let cmd = `cd ${this.moduleId}&&set appId=%APP_ID%&&set MT_WEBPORTAL_LINK=${mtWebportalLink}&&set DESIGNED_USER_JOBNAME=${this.jobName}&&set JOB_GROUP_TAG=${jobUtils.groupIdPrefix}${this.groupId}&&${filled}`;
        return cmd;
    }

    async generateLauncherPutConfig(moduleParams) {
        let command = await this.generateCommand(moduleParams);
        let sourceLocation = `${mpEnvDict['MODULE_URI']}${mpEnvDict['MODULE_DIR']}${this.moduleId}`;
        let groupTag = `${jobUtils.groupIdPrefix}${this.groupId}`;
        let config = {
            'Version': 1,
            'Owner': {
                'Name': this.userName,
                'Element': {
                    'Password': null,
                },
            },
            'PassUserNameInfoContainer': moduleParams.PassUserNameInfoContainer,
            'RetryPolicy': {
                'Name': 'ServiceRetryPolicy_Release',
                'Element': {
                    'MaxRetryCount': 0,
                    'FancyRetryPolicy': true,
                },
            },
            'TaskRoles': [
                {
                    'Name': 'taskRole',
                    'Element': {
                        'TaskNumber': 1,
                        'TaskRetryPolicy': {
                            'Name': 'ServiceRetryPolicy_Release',
                            'Element': {
                                'MaxRetryCount': 0,
                                'FancyRetryPolicy': true,
                            },
                        },
                        'TaskService': {
                            'Name': 'MarketPlace',
                            'Element': {
                                'Version': 1,
                                'EntryPoint': command,
                                'SourceLocations': [
                                    sourceLocation,
                                ],
                                'Resource': {
                                    'Name': 'jobdriverResource',
                                    'Element': {
                                        'CpuNumber': moduleParams.JobDriverVCores,
                                        'MemoryMB': moduleParams.JobDriverMemGB * 1024, // Convert GB to MB
                                    },
                                },
                            },
                        },
                    },
                },
            ],
            'PlatformSpecificParameters': {
                'Name': 'ServiceOnYarnSpecificParameters',
                'Element': {
                    'AMNodeLabel': moduleParams.JobNodeLabel,
                    'TaskNodeLabel': moduleParams.JobNodeLabel,
                    'Queue': moduleParams.JobQueue,
                    'Tags': [groupTag],
                },
            },
        };
        return config;
    }

    async submit(moduleParams) {
        // Migrated from commit 7ba816ae
        let jobQueue = moduleParams.JobQueue;
        logger.info(`Job submission permission check, user: ${this.userName}, queue: ${jobQueue}`);
        const submitAllowed = await checkSubmitAllowed(this.userName, jobQueue);
        if (!submitAllowed) {
            throw createError(
                'Forbidden',
                'ForbiddenUserError',
                `User ${this.userName} is not allowed to submit applications to ${jobQueue}.`
            );
        }
        // check framework exist or not
        let frameworkNameExist = await checkFrameworkNameExist(this.serviceFrameworkName);
        if (frameworkNameExist) {
            throw createError(
                'Bad Request', 'InvalidParametersError',
                `Conflict! FrameworkName [${this.serviceFrameworkName}] already exist in FrameworkLauncher!`
            );
        }
        // prepare hdfs folder
        await createHdfsFolder(this.userName, this.jobName);
        // Send put request to launcher
        let putUrl = launcherConfig.frameworkPath(this.serviceFrameworkName);
        // generate launcher put config
        let putConfig = await this.generateLauncherPutConfig(moduleParams);
        // Send request to launcher
        try {
            let response = await axios({
                method: 'put',
                url: putUrl,
                data: putConfig,
                headers: launcherConfig.getRequestHeaders(),
            });
            return {
                'location': response.headers.location,
                'groupId': this.groupId,
            };
        } catch (err) {
            if (err.response) {
                throw createError.unknown(err.response.data.message);
            } else {
                throw createError.unknown(err);
            }
        }
    }
}


module.exports = {
    MTJob,
};
