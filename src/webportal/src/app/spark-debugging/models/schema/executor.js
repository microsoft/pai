import Convert from '../utils/convert-utils';

export default class Executor {
  static async asyncGetExecutors(helper) {
    let jsonArr = await helper.get('/allexecutors', {
      timeout: 30000,
    });
    return jsonArr.map(json => this.parseSingleExecutorJson(json));
  }

  static parseSingleExecutorJson(json) {
    return {
      id: json['id'],
      taskList: [],
      host: json['hostPort'].substring(0, json['hostPort'].lastIndexOf(':')),
      isActive: json['isActive'],
      rddBlocks: json['rddBlocks'],
      memoryUsed: json['memoryUsed'],
      diskUsed: json['diskUsed'],
      totalCores: json['totalCores'],
      maxTasks: json['maxTasks'],
      activeTasks: json['activeTasks'],
      failedTasks: json['failedTasks'],
      completedTasks: json['completedTasks'],
      totalTasks: json['totalTasks'],
      totalDuration: json['totalDuration'],
      totalGCTime: json['totalGCTime'],
      totalInputBytes: json['totalInputBytes'],
      totalShuffleRead: json['totalShuffleRead'],
      totalShuffleWrite: json['totalShuffleWrite'],
      isBlacklisted: json['isBlacklisted'],
      maxMemory: json['maxMemory'],
      addTime: Convert.timeString2MillSec(json['addTime']),
      finishTime: Convert.timeString2MillSec(json['addTime']) + json['totalDuration'],
      removeTime: json['removeTime'] === null ? null : Convert.timeString2MillSec(json['removeTime']),
      removeReason: json['removeReason'],
      stderr: json['executorLogs']['stderr'],
      stdout: json['executorLogs']['stdout'],
    }
  }
}