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
const async = require('async');
const path = require('path');
const fs = require('fs');
const unirest = require('unirest');
const _ = require('lodash');
const mustache = require('mustache');
const keygen = require('ssh-keygen');
const yaml = require('js-yaml');
const userModelV2 = require('@pai/models/v2/user' );
const axios = require('axios');
const vcModel = require('@pai/models/v2/virtual-cluster');
const launcherConfig = require('@pai/config/launcher');
const yarnContainerScriptTemplate = require('@pai/templates/yarnContainerScript');
const dockerContainerScriptTemplate = require('@pai/templates/dockerContainerScript');
const createError = require('@pai/utils/error');
const logger = require('@pai/config/logger');
const Hdfs = require('@pai/utils/hdfs');
const azureEnv = require('@pai/config/azure');
const paiConfig = require('@pai/config/paiConfig');
const env = require('@pai/utils/env');

let exitSpecPath;
if (process.env[env.exitSpecPath]) {
  exitSpecPath = process.env[env.exitSpecPath];
  if (!path.isAbsolute(exitSpecPath)) {
    exitSpecPath = path.resolve(__dirname, '../../../../', exitSpecPath);
  }
} else {
  exitSpecPath = '/job-exit-spec-configuration/job-exit-spec.yaml';
}
const exitSpecList = yaml.safeLoad(fs.readFileSync(exitSpecPath));
const positiveFallbackExitCode = 256;
const negativeFallbackExitCode = -8000;
const exitSpecMap = {};
exitSpecList.forEach((val) => {
  exitSpecMap[val.code] = val;
});

class Job {
  constructor(name, namespace, next) {
    this.name = name;
    this.getJob(name, namespace, (jobDetail, error) => {
      if (error === null) {
        for (let key of Object.keys(jobDetail)) {
          this[key] = jobDetail[key];
        }
      }
      next(this, error);
    });
  }

  convertJobState(frameworkState, exitCode) {
    let jobState = '';
    switch (frameworkState) {
      case 'FRAMEWORK_WAITING':
      case 'APPLICATION_CREATED':
      case 'APPLICATION_LAUNCHED':
      case 'APPLICATION_WAITING':
      case 'APPLICATION_RETRIEVING_DIAGNOSTICS':
      case 'APPLICATION_COMPLETED':
        jobState = 'WAITING';
        break;
      case 'APPLICATION_RUNNING':
        jobState = 'RUNNING';
        break;
      case 'FRAMEWORK_COMPLETED':
        if (exitCode === 0) {
          jobState = 'SUCCEEDED';
        } else if (exitCode === -7351) {
          jobState = 'STOPPED';
        } else {
          jobState = 'FAILED';
        }
        break;
      default:
        jobState = 'UNKNOWN';
    }
    return jobState;
  }

  convertTaskState(taskState, exitCode) {
    switch (taskState) {
      case 'TASK_WAITING':
      case 'CONTAINER_REQUESTED':
      case 'CONTAINER_ALLOCATED':
        return 'WAITING';
      case 'CONTAINER_RUNNING':
      case 'CONTAINER_COMPLETED':
        return 'RUNNING';
      case 'TASK_COMPLETED':
        if (exitCode === 0) {
          return 'SUCCEEDED';
        } else if (exitCode === -7400) {
          return 'STOPPED';
        } else {
          return 'FAILED';
        }
      default:
        return 'UNKNOWN';
    }
  }

  async asyncGetJobList(query, namespace) {
    let reqPath = launcherConfig.frameworksPath();
    if (namespace) {
      reqPath = `${reqPath}?UserName=${namespace}`;
    } else if (query.username) {
      reqPath = `${reqPath}?UserName=${query.username}`;
    }
    try {
      const response = axios.get(reqPath, {
        headers: launcherConfig.webserviceRequestHeaders(namespace),
      });
      const resJson = typeof response.body === 'object'?
        response.body : JSON.parse(response.body);
      if (response.status !== 200) {
        throw createError(response.status, 'UnknownError', response.raw_body);
      }
      let jobList = resJson.summarizedFrameworkInfos.map((frameworkInfo) => {
        // 1. transientNormalRetriedCount
        //    Failed, and it can ensure that it will success within a finite retry times:
        //    such as dependent components shutdown, machine error, network error,
        //    configuration error, environment error...
        // 2. transientConflictRetriedCount
        //    A special TRANSIENT_NORMAL which indicate the exit due to resource conflict
        //    and cannot get required resource to run.
        // 3. unKnownRetriedCount
        //    Usually caused by user's code.
        const platformRetries = frameworkInfo.frameworkRetryPolicyState.transientNormalRetriedCount;
        const resourceRetries = frameworkInfo.frameworkRetryPolicyState.transientConflictRetriedCount;
        const userRetries = frameworkInfo.frameworkRetryPolicyState.unKnownRetriedCount;
        const job = {
          name: frameworkInfo.frameworkName,
          username: frameworkInfo.userName,
          state: this.convertJobState(frameworkInfo.frameworkState, frameworkInfo.applicationExitCode),
          subState: frameworkInfo.frameworkState,
          executionType: frameworkInfo.executionType,
          retries: platformRetries + resourceRetries + userRetries,
          retryDetails: {
            user: userRetries,
            platform: platformRetries,
            resource: resourceRetries,
          },
          createdTime: frameworkInfo.firstRequestTimestamp || new Date(2018, 1, 1).getTime(),
          completedTime: frameworkInfo.frameworkCompletedTimestamp,
          appExitCode: frameworkInfo.applicationExitCode,
          virtualCluster: frameworkInfo.queue,
          totalGpuNumber: frameworkInfo.totalGpuNumber,
          totalTaskNumber: frameworkInfo.totalTaskNumber,
          totalTaskRoleNumber: frameworkInfo.totalTaskRoleNumber,
        };
        const tildeIndex = job.name.indexOf('~');
        if (tildeIndex > -1) {
          const namespace = job.name.slice(0, tildeIndex);
          if (namespace !== job.username) {
            logger.warn('Found a job with different namespace and username: ', job.name, job.username);
            job.namespace = namespace;
          }
          job.name = job.name.slice(tildeIndex + 1);
        } else {
          job.legacy = true;
        }
        return job;
        }
      );
      jobList.sort((a, b) => b.createdTime - a.createdTime);
      return jobList;
    } catch (error) {
      throw error;
    }
  }

  getJobList(query, namespace, next) {
    let reqPath = launcherConfig.frameworksPath();
    if (namespace) {
      reqPath = `${reqPath}?UserName=${namespace}`;
    } else if (query.username) {
      reqPath = `${reqPath}?UserName=${query.username}`;
    }
    unirest.get(reqPath)
      .headers(launcherConfig.webserviceRequestHeaders(namespace))
      .end((res) => {
        try {
          const resJson = typeof res.body === 'object' ?
            res.body : JSON.parse(res.body);
          if (res.status !== 200) {
            return next(null, createError(res.status, 'UnknownError', res.raw_body));
          }
          let jobList = resJson.summarizedFrameworkInfos.map((frameworkInfo) => {
            // 1. transientNormalRetriedCount
            //    Failed, and it can ensure that it will success within a finite retry times:
            //    such as dependent components shutdown, machine error, network error,
            //    configuration error, environment error...
            // 2. transientConflictRetriedCount
            //    A special TRANSIENT_NORMAL which indicate the exit due to resource conflict
            //    and cannot get required resource to run.
            // 3. unKnownRetriedCount
            //    Usually caused by user's code.
            const platformRetries = frameworkInfo.frameworkRetryPolicyState.transientNormalRetriedCount;
            const resourceRetries = frameworkInfo.frameworkRetryPolicyState.transientConflictRetriedCount;
            const userRetries = frameworkInfo.frameworkRetryPolicyState.unKnownRetriedCount;
            const job = {
              name: frameworkInfo.frameworkName,
              username: frameworkInfo.userName,
              state: this.convertJobState(frameworkInfo.frameworkState, frameworkInfo.applicationExitCode),
              subState: frameworkInfo.frameworkState,
              executionType: frameworkInfo.executionType,
              retries: platformRetries + resourceRetries + userRetries,
              retryDetails: {
                user: userRetries,
                platform: platformRetries,
                resource: resourceRetries,
              },
              createdTime: frameworkInfo.firstRequestTimestamp || new Date(2018, 1, 1).getTime(),
              completedTime: frameworkInfo.frameworkCompletedTimestamp,
              appExitCode: frameworkInfo.applicationExitCode,
              virtualCluster: frameworkInfo.queue,
              totalGpuNumber: frameworkInfo.totalGpuNumber,
              totalTaskNumber: frameworkInfo.totalTaskNumber,
              totalTaskRoleNumber: frameworkInfo.totalTaskRoleNumber,
            };

            const tildeIndex = job.name.indexOf('~');
            if (tildeIndex > -1) {
              const namespace = job.name.slice(0, tildeIndex);
              if (namespace !== job.username) {
                logger.warn('Found a job with different namespace and username: ', job.name, job.username);
                job.namespace = namespace;
              }
              job.name = job.name.slice(tildeIndex + 1);
            } else {
              job.legacy = true;
            }

            return job;
          });
          jobList.sort((a, b) => b.createdTime - a.createdTime);
          next(jobList);
        } catch (error) {
          next(null, error);
        }
      });
  }

  getJob(name, namespace, next) {
    const frameworkName = namespace ? `${namespace}~${name}` : name;
    unirest.get(launcherConfig.frameworkPath(frameworkName))
      .headers(launcherConfig.webserviceRequestHeaders(namespace))
      .end((requestRes) => {
        try {
          const requestResJson =
            typeof requestRes.body === 'object' ?
              requestRes.body :
              JSON.parse(requestRes.body);
          if (requestRes.status === 200) {
            next(this.generateJobDetail(requestResJson), null);
          } else if (requestRes.status === 404) {
            next(null, createError('Not Found', 'NoJobError', `Job ${name} is not found.`));
          } else {
            next(null, createError(requestRes.status, 'UnknownError', requestRes.raw_body));
          }
        } catch (error) {
          next(null, error);
        }
      });
  }

  async putJobAsync(name, namespace, data) {
    try {
      const frameworkName = namespace ? `${namespace}~${name}` : name;
      data.jobName = frameworkName;
      if (!data.originalData.outputDir) {
        data.outputDir = `${launcherConfig.hdfsUri}/Output/${data.userName}/${name}`;
      }
      for (let fsPath of ['authFile', 'dataDir', 'outputDir', 'codeDir']) {
        data[fsPath] = data[fsPath].replace('$PAI_DEFAULT_FS_URI', launcherConfig.hdfsUri);
        data[fsPath] = data[fsPath].replace(/\$PAI_JOB_NAME(?![\w\d])/g, name);
        data[fsPath] = data[fsPath].replace(/(\$PAI_USER_NAME|\$PAI_USERNAME)(?![\w\d])/g, data.userName);
      }
      const vcList = await vcModel.list();
      data.virtualCluster = (!data.virtualCluster) ? 'default' : data.virtualCluster;
      if (!(data.virtualCluster in vcList)) {
        throw createError('Not Found', 'NoVirtualClusterError', `Virtual cluster ${data.virtualCluster} is not found.`);
      }
      const hasPermission = await userModelV2.checkUserVC(data.userName, data.virtualCluster);
      if (!hasPermission) {
        throw createError('Forbidden', 'ForbiddenUserError', `User ${data.userName} is not allowed to do operation in ${data.virtualCluster}`);
      }
      await this._initializeJobContextRootFoldersAsync();
      await this._prepareJobContextAsync(frameworkName, data);
      await axios.put(launcherConfig.frameworkPath(frameworkName), this.generateFrameworkDescription(data), {
        headers: launcherConfig.webserviceRequestHeaders(namespace || data.userName),
      });
    } catch (error) {
      throw error;
    }
  }

  deleteJob(name, namespace, data, next) {
    const frameworkName = namespace ? `${namespace}~${name}` : name;
    unirest.get(launcherConfig.frameworkRequestPath(frameworkName))
      .headers(launcherConfig.webserviceRequestHeaders(namespace))
      .end((requestRes) => {
        const requestResJson = typeof requestRes.body === 'object' ?
          requestRes.body : JSON.parse(requestRes.body);
        if (requestRes.status !== 200) {
          next(createError(requestRes.status, 'UnknownError', requestRes.raw_body));
        } else if (data.username === requestResJson.frameworkDescriptor.user.name || data.admin) {
          unirest.delete(launcherConfig.frameworkPath(frameworkName))
            .headers(launcherConfig.webserviceRequestHeaders(namespace))
            .end((requestRes) => {
              if (requestRes.status !== 202) {
                return next(createError(requestRes.status, 'UnknownError', requestRes.raw_body));
              }
              next();
            });
        } else {
          next(createError('Forbidden', 'ForbiddenUserError', `User ${data.username} is not allowed to remove job ${name}.`));
        }
      });
  }

  putJobExecutionType(name, namespace, data, next) {
    const frameworkName = namespace ? `${namespace}~${name}` : name;
    unirest.get(launcherConfig.frameworkRequestPath(frameworkName))
      .headers(launcherConfig.webserviceRequestHeaders(data.username))
      .end((requestRes) => {
        const requestResJson = typeof requestRes.body === 'object' ?
          requestRes.body : JSON.parse(requestRes.body);
        if (requestRes.status !== 200) {
          next(createError(requestRes.status, 'UnknownError', requestRes.raw_body));
        } else if (data.username === requestResJson.frameworkDescriptor.user.name || data.admin) {
          unirest.put(launcherConfig.frameworkExecutionTypePath(frameworkName))
            .headers(launcherConfig.webserviceRequestHeaders(data.admin ? 'root' : data.username))
            .send({'executionType': data.value})
            .end((requestRes) => {
              if (requestRes.status !== 202) {
                return next(createError(requestRes.status, 'UnknownError', requestRes.raw_body));
              }
              next();
            });
        } else {
          next(createError('Forbidden', 'ForbiddenUserError', `User ${data.username} is not allowed to execute job ${name}.`));
        }
      });
  }

  getJobConfig(userName, namespace, jobName, next) {
    if (namespace) {
      jobName = `${namespace}~${jobName}`;
    }
    const hdfs = new Hdfs(launcherConfig.webhdfsUri);
    hdfs.readFile(
      `/Container/${userName}/${jobName}/JobConfig.yaml`,
      null,
      (error, result) => {
        if (!error) {
          next(null, result.content);
        } else {
          hdfs.readFile(
            `/Container/${userName}/${jobName}/JobConfig.json`,
            null,
            (error, result) => {
              if (!error) {
                next(null, result.content);
              } else {
                next(error);
              }
            }
          );
        }
      }
    );
  }

  getJobSshInfo(userName, namespace, jobName, applicationId, next) {
    if (namespace) {
      jobName = `${namespace}~${jobName}`;
    }
    const folderPathPrefix = `/Container/${userName}/${jobName}/ssh/${applicationId}`;
    const hdfs = new Hdfs(launcherConfig.webhdfsUri);
    hdfs.list(
      folderPathPrefix,
      null,
      (error, connectInfo) => {
        if (!error) {
          let latestKeyFilePath = `/Container/${userName}/${jobName}/ssh/keyFiles`;
          let sshInfo = {};
          // Handle backward compatibility
          hdfs.list(latestKeyFilePath,
            null,
            (error, result) => {
              if (!error) {
                sshInfo = {
                  'containers': [],
                  'keyPair': {
                    'folderPath': `${launcherConfig.hdfsUri}${latestKeyFilePath}`,
                    'publicKeyFileName': `${jobName}.pub`,
                    'privateKeyFileName': `${jobName}`,
                    'privateKeyDirectDownloadLink':
                      `${launcherConfig.webhdfsUri}/webhdfs/v1${latestKeyFilePath}/${jobName}?op=OPEN`,
                  },
                };
              } else {
                // older pattern is ${launcherConfig.hdfsUri}${folderPathPrefix}/.ssh/
                sshInfo = {
                  'containers': [],
                  'keyPair': {
                    'folderPath': `${launcherConfig.hdfsUri}${folderPathPrefix}/.ssh/`,
                    'publicKeyFileName': `${applicationId}.pub`,
                    'privateKeyFileName': `${applicationId}`,
                    'privateKeyDirectDownloadLink':
                      `${launcherConfig.webhdfsUri}/webhdfs/v1${folderPathPrefix}/.ssh/${applicationId}?op=OPEN`,
                  },
                };
              }
              for (let x of connectInfo.content.FileStatuses.FileStatus) {
                let pattern = /^container_(.*)-(.*)-(.*)$/g;
                let arr = pattern.exec(x.pathSuffix);
                if (arr !== null) {
                  sshInfo.containers.push({
                    'id': 'container_' + arr[1],
                    'sshIp': arr[2],
                    'sshPort': arr[3],
                  });
                }
              }
              next(null, sshInfo);
            });
        } else {
          next(error);
        }
      }
    );
  }

  generateExitSpec(code) {
    if (!_.isNil(code)) {
      if (!_.isNil(exitSpecMap[code])) {
        return exitSpecMap[code];
      } else {
        if (code > 0) {
          return {
            ...exitSpecMap[positiveFallbackExitCode],
            code,
          };
        } else {
          return {
            ...exitSpecMap[negativeFallbackExitCode],
            code,
          };
        }
      }
    } else {
      return null;
    }
  }

  extractContainerStderr(diag) {
    if (_.isEmpty(diag)) {
      return null;
    }
    const anchor1 = /ExitCodeException exitCode.*?:/;
    const anchor2 = /at org\.apache\.hadoop\.util\.Shell\.runCommand/;
    const match1 = diag.match(anchor1);
    const match2 = diag.match(anchor2);
    if (match1 !== null && match2 !== null) {
      const start = match1.index + match1[0].length;
      const end = match2.index;
      return diag.substring(start, end).trim();
    }
  }

  extractRuntimeOutput(diag, code) {
    if (_.isEmpty(diag) || code < 0) {
      return null;
    }
    const anchor1 = /\[PAI_RUNTIME_ERROR_START\]/;
    const anchor2 = /\[PAI_RUNTIME_ERROR_END\]/;
    const match1 = diag.match(anchor1);
    const match2 = diag.match(anchor2);
    if (match1 !== null && match2 !== null) {
      const start = match1.index + match1[0].length;
      const end = match2.index;
      const output = diag.substring(start, end).trim();
      return yaml.safeLoad(output);
    }
  }

  extractLauncherOutput(diag, code) {
    if (_.isEmpty(diag) || code > 0) {
      return null;
    }
    const re = /^(.*)$/m;
    return diag.match(re)[0].trim();
  }

  generateJobDetail(framework) {
    let jobDetail = {
      'jobStatus': {},
      'taskRoles': {},
    };
    const frameworkStatus = framework.aggregatedFrameworkStatus.frameworkStatus;
    if (frameworkStatus) {
      const jobState = this.convertJobState(
        frameworkStatus.frameworkState,
        frameworkStatus.applicationExitCode,
      );

      const platformRetries = frameworkStatus.frameworkRetryPolicyState.transientNormalRetriedCount;
      const resourceRetries = frameworkStatus.frameworkRetryPolicyState.transientConflictRetriedCount;
      const userRetries = frameworkStatus.frameworkRetryPolicyState.unKnownRetriedCount;
      jobDetail.jobStatus = {
        name: framework.name,
        username: 'unknown',
        state: jobState,
        subState: frameworkStatus.frameworkState,
        executionType: framework.summarizedFrameworkInfo.executionType,
        retries: platformRetries + resourceRetries + userRetries,
        retryDetails: {
          user: userRetries,
          platform: platformRetries,
          resource: resourceRetries,
        },
        createdTime: frameworkStatus.frameworkCreatedTimestamp,
        completedTime: frameworkStatus.frameworkCompletedTimestamp,
        appId: frameworkStatus.applicationId,
        appProgress: frameworkStatus.applicationProgress,
        appTrackingUrl: frameworkStatus.applicationTrackingUrl,
        appLaunchedTime: frameworkStatus.applicationLaunchedTimestamp,
        appCompletedTime: frameworkStatus.applicationCompletedTimestamp,
        appExitCode: frameworkStatus.applicationExitCode,
        appExitSpec: this.generateExitSpec(frameworkStatus.applicationExitCode),
        appExitDiagnostics: frameworkStatus.applicationExitDiagnostics,
        appExitMessages: {
          container: this.extractContainerStderr(frameworkStatus.applicationExitDiagnostics),
          runtime: this.extractRuntimeOutput(frameworkStatus.applicationExitDiagnostics, frameworkStatus.applicationExitCode),
          launcher: this.extractLauncherOutput(frameworkStatus.applicationExitDiagnostics, frameworkStatus.applicationExitCode),
        },
        appExitTriggerMessage: frameworkStatus.applicationExitTriggerMessage,
        appExitTriggerTaskRoleName: frameworkStatus.applicationExitTriggerTaskRoleName,
        appExitTriggerTaskIndex: frameworkStatus.applicationExitTriggerTaskIndex,
        // deprecated
        appExitType: frameworkStatus.applicationExitType,
      };
    }
    const frameworkRequest = framework.aggregatedFrameworkRequest.frameworkRequest;
    if (frameworkRequest.frameworkDescriptor) {
      jobDetail.jobStatus.username = frameworkRequest.frameworkDescriptor.user.name;
    }
    const frameworkInfo = framework.summarizedFrameworkInfo;
    if (frameworkInfo) {
      jobDetail.jobStatus.virtualCluster = frameworkInfo.queue;
    }
    const taskRoleStatuses = framework.aggregatedFrameworkStatus.aggregatedTaskRoleStatuses;
    if (taskRoleStatuses) {
      for (let taskRole of Object.keys(taskRoleStatuses)) {
        jobDetail.taskRoles[taskRole] = {
          taskRoleStatus: {name: taskRole},
          taskStatuses: [],
        };
        for (let task of taskRoleStatuses[taskRole].taskStatuses.taskStatusArray) {
          const containerPorts = {};
          if (task.containerPorts) {
            for (let portStr of task.containerPorts.split(';')) {
              if (portStr.length > 0) {
                const port = portStr.split(':');
                containerPorts[port[0]] = port[1];
              }
            }
          }
          jobDetail.taskRoles[taskRole].taskStatuses.push({
            taskIndex: task.taskIndex,
            taskState: this.convertTaskState(task.taskState, task.containerExitCode),
            containerId: task.containerId,
            containerIp: task.containerIp,
            containerPorts,
            containerGpus: task.containerGpus,
            containerLog: task.containerLogHttpAddress,
            containerExitCode: task.containerExitCode,
          });
        }
      }
    }
    return jobDetail;
  }

  generateYarnContainerScript(data, idx) {
    let tasksNumber = 0;
    for (let i = 0; i < data.taskRoles.length; i ++) {
      tasksNumber += data.taskRoles[i].taskNumber;
    }
    let jobEnvs = [];
    if (data.jobEnvs) {
        for (let key in data.jobEnvs) {
            if (data.jobEnvs.hasOwnProperty(key)) {
                jobEnvs.push({key, value: data.jobEnvs[key]});
            }
        }
    }
    const yarnContainerScript = mustache.render(
        yarnContainerScriptTemplate, {
          'idx': idx,
          'tasksNumber': tasksNumber,
          'taskRoleList': data.taskRoles.map((x) => x.name).join(','),
          'taskRolesNumber': data.taskRoles.length,
          'hdfsUri': launcherConfig.hdfsUri,
          'aggregatedStatusUri': launcherConfig.frameworkAggregatedStatusPath(data.jobName),
          'frameworkInfoWebhdfsUri': launcherConfig.frameworkInfoWebhdfsPath(data.jobName),
          'taskData': data.taskRoles[idx],
          'jobData': data,
          'inspectPidFormat': '{{.State.Pid}}',
          'infoDefaultRuntimeFormat': '"{{json .DefaultRuntime}}"',
          'jobEnvs': jobEnvs,
          'azRDMA': azureEnv.azRDMA === 'false' ? false : true,
          'isDebug': data.jobEnvs && data.jobEnvs.isDebug === true ? true : false,
          'reqAzRDMA': data.jobEnvs && data.jobEnvs.paiAzRDMA === true ? true : false,
        });
    return yarnContainerScript;
  }

  generateDockerContainerScript(data, idx) {
    const dockerContainerScript = mustache.render(
        dockerContainerScriptTemplate, {
          'idx': idx,
          'hdfsUri': launcherConfig.hdfsUri,
          'taskData': data.taskRoles[idx],
          'jobData': data,
          'webHdfsUri': launcherConfig.webhdfsUri,
          'azRDMA': azureEnv.azRDMA === 'false' ? false : true,
          'paiMachineList': paiConfig.machineList,
          'reqAzRDMA': data.jobEnvs && data.jobEnvs.paiAzRDMA === true ? true : false,
          'isDebug': data.jobEnvs && data.jobEnvs.isDebug === true ? true : false,
          'debuggingReservationSeconds': paiConfig.debuggingReservationSeconds,
        });
    return dockerContainerScript;
  }

  generateFrameworkDescription(data) {
    const gpuType = data.gpuType || null;
    const fancyRetryPolicy = (data.retryCount !== -2);
    const virtualCluster = (!data.virtualCluster) ? 'default' : data.virtualCluster;
    const frameworkDescription = {
      'version': 10,
      'user': {
        'name': data.userName,
      },
      'retryPolicy': {
        'maxRetryCount': data.retryCount,
        'fancyRetryPolicy': fancyRetryPolicy,
      },
      'taskRoles': {},
      'platformSpecificParameters': {
        'queue': virtualCluster,
        'taskNodeGpuType': gpuType,
        'gangAllocation': true,
        'amResource': {
          'cpuNumber': launcherConfig.amResource.cpuNumber,
          'memoryMB': launcherConfig.amResource.memoryMB,
          'diskType': launcherConfig.amResource.diskType,
          'diskMB': launcherConfig.amResource.diskMB,
        },
      },
    };
    for (let i = 0; i < data.taskRoles.length; i++) {
      const portList = {};
      for (let j = 0; j < data.taskRoles[i].portList.length; j++) {
        portList[data.taskRoles[i].portList[j].label] = {
          'start': data.taskRoles[i].portList[j].beginAt,
          'count': data.taskRoles[i].portList[j].portNumber,
        };
      }
      for (let defaultPortLabel of ['http', 'ssh']) {
        if (!(defaultPortLabel in portList)) {
          portList[defaultPortLabel] = {
            'start': 0,
            'count': 1,
          };
        }
      }
      const taskRole = {
        'taskNumber': data.taskRoles[i].taskNumber,
        'taskService': {
          'version': 0,
          'entryPoint': `trap \\"\\" TERM; bash YarnContainerScripts/${i}.sh`,
          'sourceLocations': [`/Container/${data.userName}/${data.jobName}/YarnContainerScripts`],
          'resource': {
            'cpuNumber': data.taskRoles[i].cpuNumber,
            'memoryMB': data.taskRoles[i].memoryMB,
            'gpuNumber': data.taskRoles[i].gpuNumber,
            'portDefinitions': portList,
            'diskType': 0,
            'diskMB': 0,
          },
        },
        'applicationCompletionPolicy': {
          'minFailedTaskCount': data.taskRoles[i].minFailedTaskCount,
          'minSucceededTaskCount': data.taskRoles[i].minSucceededTaskCount,
        },
      };
      frameworkDescription.taskRoles[data.taskRoles[i].name] = taskRole;
    }
    return frameworkDescription;
  }

  generateSshKeyFilesPromise(name) {
    return new Promise(function(res, rej) {
      keygen({
        location: name,
        read: true,
        destroy: true,
      }, (err, key) => {
        if (err) {
          rej(err);
        } else {
          let sshKeyFiles = [{'content': key.pubKey, 'fileName': name+'.pub'}, {'content': key.key, 'fileName': name}];
          res(sshKeyFiles);
        }
      });
    });
  }

  generateSshKeyFiles(name, next) {
    keygen({
      location: name,
      read: true,
      destroy: true,
    }, function(err, out) {
      if (err) {
        next(err);
      } else {
        let sshKeyFiles = [{'content': out.pubKey, 'fileName': name+'.pub'}, {'content': out.key, 'fileName': name}];
        next(null, sshKeyFiles);
      }
    });
  }

  async _initializeJobContextRootFoldersAsync() {
    try {
      const hdfs = new Hdfs(launcherConfig.webhdfsUri);
      await Promise.all([
        hdfs.createFolderAsync(
          '/Output',
          {'user.name': 'root', 'permission': '777'}
          ),
        hdfs.createFolderAsync(
          '/Container',
          {'user.name': 'root', 'permission': '777'}
        ),
      ]);
    } catch (error) {
      throw error;
    }
  }

  _initializeJobContextRootFolders(next) {
    const hdfs = new Hdfs(launcherConfig.webhdfsUri);
    async.parallel([
      (parallelCallback) => {
        hdfs.createFolder(
          '/Output',
          {'user.name': 'root', 'permission': '777'},
          (error, result) => {
            parallelCallback(error);
          }
        );
      },
      (parallelCallback) => {
        hdfs.createFolder(
          '/Container',
          {'user.name': 'root', 'permission': '777'},
          (error, result) => {
            parallelCallback(error);
          }
        );
      },
    ], (parallelError) => {
      return next(parallelError);
    });
  }

  async _prepareJobContextAsync(name, data) {
    try {
      const hdfs = new Hdfs(launcherConfig.webhdfsUri);
      const p1 = async () => {
        if (!data.originalData.outputDir) {
          try {
            await hdfs.createFolderAsync(
              `/Output/${data.userName}/${name}`,
              {'user.name': data.userName, 'permission': '755'},
            );
          } catch (error) {
            throw error;
          }
        }
      };

      const p2 = async () => {
        try {
          for (const item of ['log', 'tmp']) {
            await hdfs.createFolderAsync(
              `/Container/${data.userName}/${name}/` + item,
              {'user.name': data.userName, 'permission': '755'}
            );
          }
        } catch (error) {
          throw error;
        }
      };

      const p3 = async () => {
        try {
          for (const item of [...Array(data.taskRoles.length).keys()]) {
            await hdfs.createFileAsync(
              `/Container/${data.userName}/${name}/YarnContainerScripts/${item}.sh`,
              this.generateYarnContainerScript(data, item),
              {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'}
            );
          }
        } catch (error) {
          throw error;
        }
      };

      const p4 = async () => {
        try {
          for (const item of [...Array(data.taskRoles.length).keys()]) {
            await hdfs.createFileAsync(
              `/Container/${data.userName}/${name}/DockerContainerScripts/${item}.sh`,
              this.generateDockerContainerScript(data, item),
              {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'}
            );
          }
        } catch (error) {
          throw error;
        }
      };

      const p5 = async () => {
        try {
          await hdfs.createFileAsync(
            `/Container/${data.userName}/${name}/${launcherConfig.jobConfigFileName}`,
            JSON.stringify(data.originalData, null, 2),
            {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'}
          );
        } catch (error) {
          throw error;
        }
      };

      const p6 = async () => {
        try {
          await hdfs.createFileAsync(
            `/Container/${data.userName}/${name}/${launcherConfig.frameworkDescriptionFilename}`,
            JSON.stringify(this.generateFrameworkDescription(data), null, 2),
            {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'}
          );
        } catch (error) {
          throw error;
        }
      };

      const p7 = async () => {
        try {
          if (process.platform.toUpperCase() === 'LINUX') {
            const sshKeyFile = await this.generateSshKeyFilesPromise(name);
            for (const item of sshKeyFile) {
              await hdfs.createFileAsync(
                `/Container/${data.userName}/${name}/ssh/keyFiles/${item.fileName}`,
                item.content,
                {'user.name': data.userName, 'permission': '775', 'overwrite': 'true'},
              );
            }
          }
        } catch (error) {
          throw error;
        }
      };
      await Promise.all([p1(), p2(), p3(), p4(), p5(), p6(), p7()]);
    } catch (error) {
      throw error;
    }
  }

  _prepareJobContext(name, data, next) {
    const hdfs = new Hdfs(launcherConfig.webhdfsUri);
    async.parallel([
      (parallelCallback) => {
        if (!data.originalData.outputDir) {
          hdfs.createFolder(
            `/Output/${data.userName}/${name}`,
            {'user.name': data.userName, 'permission': '755'},
            (error, result) => {
              parallelCallback(error);
            }
          );
        } else {
          parallelCallback(null);
        }
      },
      (parallelCallback) => {
        async.each(['log', 'tmp'], (x, eachCallback) => {
          hdfs.createFolder(
            `/Container/${data.userName}/${name}/` + x,
            {'user.name': data.userName, 'permission': '755'},
            (error, result) => {
              eachCallback(error);
            }
          );
        }, (error) => {
          parallelCallback(error);
        });
      },
      (parallelCallback) => {
        async.each([...Array(data.taskRoles.length).keys()], (x, eachCallback) => {
          hdfs.createFile(
            `/Container/${data.userName}/${name}/YarnContainerScripts/${x}.sh`,
            this.generateYarnContainerScript(data, x),
            {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'},
            (error, result) => {
              eachCallback(error);
            }
          );
        }, (error) => {
          parallelCallback(error);
        });
      },
      (parallelCallback) => {
        async.each([...Array(data.taskRoles.length).keys()], (x, eachCallback) => {
          hdfs.createFile(
            `/Container/${data.userName}/${name}/DockerContainerScripts/${x}.sh`,
            this.generateDockerContainerScript(data, x),
            {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'},
            (error, result) => {
              eachCallback(error);
            }
          );
        }, (error) => {
          parallelCallback(error);
        });
      },
      (parallelCallback) => {
        hdfs.createFile(
          `/Container/${data.userName}/${name}/${launcherConfig.jobConfigFileName}`,
          JSON.stringify(data.originalData, null, 2),
          {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'},
          (error, result) => {
            parallelCallback(error);
          }
        );
      },
      (parallelCallback) => {
        hdfs.createFile(
          `/Container/${data.userName}/${name}/${launcherConfig.frameworkDescriptionFilename}`,
          JSON.stringify(this.generateFrameworkDescription(data), null, 2),
          {'user.name': data.userName, 'permission': '644', 'overwrite': 'true'},
          (error, result) => {
            parallelCallback(error);
          }
        );
      },
      (parallelCallback) => {
        // Add OS platform check
        // Since ssh-keygen package only works for Linux
        if (process.platform.toUpperCase() === 'LINUX') {
          this.generateSshKeyFiles(name, (error, sshKeyFiles) => {
            if (error) {
              logger.warn('Generated ssh key files failed will skip generate ssh info');
              parallelCallback(null);
            } else {
              async.each(sshKeyFiles, (file, eachCallback) => {
                hdfs.createFile(
                  `/Container/${data.userName}/${name}/ssh/keyFiles/${file.fileName}`,
                  file.content,
                  {'user.name': data.userName, 'permission': '775', 'overwrite': 'true'},
                  (error, result) => {
                    eachCallback(error);
                  }
                );
              }, (error) => {
                parallelCallback(error);
              });
            }
          });
        } else {
          parallelCallback(null);
        }
      },
    ], (parallelError) => {
      return next(parallelError);
    });
  }
}

// module exports
module.exports = Job;
