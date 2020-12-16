class TaskHelp {
  static getVcoreGraphData(application, arraySize) {
    let tasks = application.getAllTasks();
    if (tasks.length == 0) {
      return {
        dataSet: [],
        stages: [],
      };
    }
    let executorList = application.executorList.filter(x => x.id !== 'driver');
    executorList.sort((a, b) => a.addTime - b.addTime);
    let appEnvInfo = application.appEnvInfo;
    let totalvCore = this.getTotalvCore(appEnvInfo);
    tasks = tasks.sort((a, b) => a.launchTime - b.launchTime);
    let arr = new Array();
    let stageArr = new Array();
    // TO DO: not familiar with js priority queue, will optimize in the future.
    let mi = tasks.map(x => x.launchTime || 0).reduce((a, b) => Math.min(a, b));
    let ma = tasks.map(x => x.finishTime || 0).reduce((a, b) => Math.max(a, b));
    let gap = (ma - mi) / arraySize;

    for (let i = -1; i <= arraySize + 1; i++) {
      let t = gap * i + mi;
      let taskNum = 0;
      let allocatedVcores = this.getVcoreNumber(executorList, t - mi, t);
      let taskGroups = this.getTaskGroups(tasks, t - gap, t);
      if (taskGroups === null) {
        stageArr.push({
          time: t,
          stageId: null,
          attemptId: null,
          runningTaskCount: 0
        });
      }
      else {
        for (let groupKey in taskGroups) { // groupKey is `${StageId}#${AttemptId}`
          let someTask = taskGroups[groupKey][0];
          stageArr.push({
            time: t,
            stageId: someTask.stageId,
            attemptId: someTask.attemptId,
            runningTaskCount: taskGroups[groupKey].length,
            totalTaskCount: application.getSpecifyStage(someTask.stageId).getAttempt(someTask.attemptId).tasks.length,
          }); // All attempts should have same total task count
          taskNum += taskGroups[groupKey].length;
        }
      }
      let utilizedVcores = Math.min(taskNum * appEnvInfo.taskCores, allocatedVcores, totalvCore > 0 ? totalvCore : allocatedVcores);
      arr.push(new Array(t, utilizedVcores, allocatedVcores));
    }
    stageArr = stageArr.sort((obj1, obj2) => {
      if (Number(obj1.stageId) < Number(obj2.stageId)) { return -1; }
      if (Number(obj1.stageId) > Number(obj2.stageId)) { return 1; }
      return 0
    });
    if (stageArr.length > 0) {
      let pStageId = stageArr[0].stageId;
      let cStagePoints = 1;
      for (let index = 1; index < stageArr.length; index++) {
        if (pStageId !== null && stageArr[index].stageId !== pStageId) {
          if (cStagePoints === 1) {
            stageArr.splice(index, 0, stageArr[index - 1]);
            index++;
          }
          pStageId = stageArr[index].stageId;
          stageArr.splice(index, 0, null);
          index++;
          cStagePoints = 0;
        }
        cStagePoints++;
      }
      if (cStagePoints === 1) {
        stageArr.splice(stageArr.length, 0, stageArr[stageArr.length - 1]);
      }
      stageArr.splice(0, 0, { 'time': mi - gap, 'stageId': null, 'attemptId': 0, 'runningTaskCount': 0, 'totalTaskCount': 0 });
      stageArr.splice(stageArr.length, 0, { 'time': ma + gap, 'stageId': null, 'attemptId': 0, 'runningTaskCount': 0, 'totalTaskCount': 0 });
    }
    return {
      dataSet: arr,
      stages: stageArr,
    };
  }

  static getTotalvCore(appEnvInfo) {
    let executorNum = appEnvInfo.executorNum;
    if (appEnvInfo.dynamicAllocationEnabled) {
      executorNum = appEnvInfo.dynamicAllocationMaxExecutors ? appEnvInfo.dynamicAllocationMaxExecutors : -1;
    }
    return appEnvInfo.executorCores * executorNum;
  }

  static getTaskGroups(tasks, start, end) {
    var runningTasks = tasks.filter(t => t.launchTime <= end && t.finishTime > start);
    if (runningTasks.length > 0) {
      return _.groupBy(runningTasks, function (task) {
        return `${task.stageId}#${task.attemptId}`;
      });
    }
    return null;
  }

  static getVcoreNumber(executorList, start, end) {
    let coreCount = 0;
    var exeList = executorList.filter(e => e.addTime <= end && (e.removeTime === null || e.removeTime > start));
    for (let executor of exeList) {
      coreCount += executor.totalCores;
    }
    return coreCount;
  }
}

export {
  TaskHelp
}