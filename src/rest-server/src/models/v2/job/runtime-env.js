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


const generateFrameworkEnv = (frameworkName, config) => {
  const [userName] = frameworkName.split('~');
  const env = {
    PAI_FRAMEWORK_NAME: frameworkName,
    PAI_JOB_NAME: frameworkName,
    PAI_USER_NAME: userName,
    PAI_DEFAULT_FS_URI: '',
    PAI_TASK_ROLE_COUNT: Object.keys(config.taskRoles).length,
    PAI_TASK_ROLE_LIST: Object.keys(config.taskRoles).join(','),
  };
  let tasksNum = 0;
  for (let taskRole of Object.keys(config.taskRoles)) {
    const tasks = config.taskRoles[taskRole];
    tasksNum += (tasks.instances || 1);
    env[`PAI_TASK_ROLE_TASK_COUNT_${taskRole}`] = (tasks.instances || 1);
    env[`PAI_RESOURCE_${taskRole}`] = [
      tasks.resourcePerInstance.gpu,
      tasks.resourcePerInstance.cpu,
      tasks.resourcePerInstance.memoryMB,
      (tasks.extraContainerOptions && 'shmMB' in tasks.extraContainerOptions) ? tasks.extraContainerOptions.shmMB : 0,
    ].join(',');
    env[`PAI_MIN_FAILED_TASK_COUNT_${taskRole}`] =
      (tasks.completion && 'minFailedInstances' in tasks.completion && tasks.completion.minFailedInstances) ?
      tasks.completion.minFailedInstances : 1;
    env[`PAI_MIN_SUCCEEDED_TASK_COUNT_${taskRole}`] =
      (tasks.completion && 'minSucceededInstances' in tasks.completion && tasks.completion.minSucceededInstances) ?
      tasks.completion.minSucceededInstances : -1;
  }
  return {
    ...env,
    // backward compatibility
    PAI_USERNAME: userName,
    PAI_TASKS_NUM: tasksNum,
    PAI_JOB_TASK_COUNT: tasksNum,
    PAI_TASK_ROLES_NUM: Object.keys(config.taskRoles).length,
    PAI_JOB_TASK_ROLE_COUNT: Object.keys(config.taskRoles).length,
    PAI_JOB_TASK_ROLE_LIST: Object.keys(config.taskRoles).join(','),
  };
};

// module exports
module.exports = {
  generateFrameworkEnv,
};
