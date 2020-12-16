import Convert from '../utils/convert-utils';

export class TaskHelper {
  static parseTaskJson(taskJson, stageId, attemptId, executorList) {
    return Task.createInstance(taskJson, stageId, attemptId, executorList);
  }
}

export class Task {
  static createInstance(taskJson, stageId, attemptId, executorList) {
    let taskMetrics = taskJson['taskMetrics'];
    let executor = (executorList === null) ? 'undefined' : executorList.find(exe => exe.id == taskJson['executorId']);
    let isExecutorExist = (typeof executor !== 'undefined');
    return {
      // pass stage info
      stageId: stageId,
      attemptId: attemptId,
      // below are task properties
      index: taskJson['index'],
      taskId: taskJson['taskId'],
      attempt: taskJson['attempt'],
      executorId: taskJson['executorId'],
      host: taskJson['host'],
      status: taskJson['status'],
      taskLocality: taskJson['taskLocality'],
      launchTime: Convert.timeString2MillSec(taskJson['launchTime']),
      duration: taskJson['duration'],
      finishTime: Convert.timeString2MillSec(taskJson['launchTime']) + taskJson['duration'],
      errorMessage: taskJson['errorMessage'] ? taskJson['errorMessage'] : '',
      accumulatorUpdates: taskJson['accumulatorUpdates'],
      speculative: taskJson['speculative'],
      logs: isExecutorExist ? { stderr: executor.stderr, stdout: executor.stdout } : { stderr: undefined, stdout: undefined },
      executorRunTime: !taskMetrics ? 0 : taskMetrics['executorRunTime'],
      jvmGcTime: !taskMetrics ? 0 : taskMetrics['jvmGcTime'],
      executorCpuTime: !taskMetrics ? 0 : taskMetrics['executorCpuTime'] / 1000000,
      schedulerDelay: !taskMetrics ? 0 : this.getSchedulerDelay(taskJson),
      peakExecutionMemory: !taskMetrics ? 0 : taskMetrics['peakExecutionMemory'],
      readBytes: !taskMetrics ? 0 : taskMetrics['inputMetrics']['bytesRead'],
      recordsRead: !taskMetrics ? 0 : taskMetrics['inputMetrics']['recordsRead'],
      bytesWritten: !taskMetrics ? 0 : taskMetrics['outputMetrics']['bytesWritten'],
      recordsWritten: !taskMetrics ? 0 : taskMetrics['outputMetrics']['recordsWritten'],
      shuffleLocalBytesRead: !taskMetrics ? 0 : taskMetrics['shuffleReadMetrics']['localBytesRead'],
      shuffleRemoteBytesRead: !taskMetrics ? 0 : taskMetrics['shuffleReadMetrics']['remoteBytesRead'],
      shuffleRecordsRead: !taskMetrics ? 0 : taskMetrics['shuffleReadMetrics']['recordsRead'],
      shuffleBytesWritten: !taskMetrics ? 0 : taskMetrics['shuffleWriteMetrics']['bytesWritten'],
      shuffleRecordsWritten: !taskMetrics ? 0 : taskMetrics['shuffleWriteMetrics']['recordsWritten'],
      taskExecutorIdExist: isExecutorExist,
      hasSkew: false,
    }
  }

  static getSchedulerDelay(taskJson) {
    if (taskJson['status'] === 'SUCCESS' && taskJson['taskMetrics']) {
      let executorOverhead = taskJson['taskMetrics']['executorDeserializeTime'] + taskJson['taskMetrics']['executorDeserializeTime'];
      let schedulerDelay = taskJson['duration'] - taskJson['taskMetrics']['executorRunTime'] - executorOverhead;
      return schedulerDelay > 0 ? schedulerDelay : 0;
    }
    return 0;
  }
} 