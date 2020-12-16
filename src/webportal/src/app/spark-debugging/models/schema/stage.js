import { TaskHelper } from "./task";
import Convert from '../utils/convert-utils';

export class StageHelper {
  static async getStage(helper, stageId, executorList) {
    let stageJson = await helper.get(`/stages/${stageId}`);
    return new Stage({
      stageId: stageId,
      attempts: StageHelper.parseAttemptsJson(stageJson, executorList),
    });
  }

  static parseAttemptsJson(attemptsJson, executorList) {
    let attempts = [];
    for (let json of attemptsJson) {
      let attempt = new StageAttempt({
        stageId: json['stageId'],
        attemptId: json['attemptId'],
        name: json['name'],
        details: json['details'],
        status: json['status'],
        inputBytes: json['inputBytes'],
        inputRecords: json['inputRecords'],
        outputBytes: json['outputBytes'],
        outputRecords: json['outputRecords'],
        completeTasks: json['numCompleteTasks'],
        duration: json['submissionTime'] && json['completionTime'] ? Convert.timeString2MillSec(json['completionTime']) - Convert.timeString2MillSec(json['submissionTime']) : 0,
        tasks: this.parseTasksJson(json['tasks'], json['stageId'], json['attemptId'], executorList),
        description: json['description'],
      });
      if(attempt.status === 'FAILED'){
        attempt.failureReason = json['failureReason'];
      }
      attempts.push(attempt);
    }
    return attempts;
  }

  static async getStageMapFromAllTasks(helper, executorList, executionPlan) {
    let stageJson = await helper.get('/allTasks', {
      timeout: executionPlan.allTaskTimeout,
    })
    let attempts = StageHelper.parseAttemptsJson(stageJson, executorList);
    let stageMap = new Map();
    for (let attempt of attempts) {
      if (!stageMap.has(attempt.stageId)) {
        stageMap.set(
          attempt.stageId,
          new Stage({
            stageId: attempt.stageId,
            attempts: [attempt]
          })
        );
      } else {
        stageMap.get(attempt.stageId).attempts.push(attempt);
      }
    }
    stageMap.forEach(x => x.attempts.sort((a, b) => a.attemptId - b.attemptId));
    return stageMap;
  }

  static parseTasksJson(tasksJson, stageId, attemptId, executorList) {
    let tasks = [];
    for (let id in tasksJson) {
      tasks.push(TaskHelper.parseTaskJson(tasksJson[id], stageId, attemptId, executorList));
    }
    return tasks;
  }
}

class StageAttempt {
  constructor(prop) {
    this.stageId = prop.stageId;
    this.attemptId = prop.attemptId;
    this.name = prop.name || 'UnKnown';
    this.details = prop.details;
    this.status = prop.status || 'COMPLETE';
    this.inputBytes = prop.inputBytes || 0;
    this.inputRecords = prop.inputRecords || 0;
    this.outputBytes = prop.outputBytes || 0;
    this.outputRecords = prop.outputRecords || 0;
    this.completeTasks = prop.completeTasks || 0;
    this.duration = prop.duration || 0;
    this.tasks = prop.tasks || [];
    this.isDataMissing = prop.isDataMissing || false;
    this.hasSkew = false;
    this.hasError = false;
    this.failureReason = prop.failureReason || 'None';
    this.description = prop.description || '';
  }

  static createDataMissingStageAttempt(props) {
    return new StageAttempt({
      stageId: props.stageId,
      isDataMissing: true,
      name: "Error to download data"
    });
  }

  checkErrorInfo() {
    return this.hasError = this.tasks.some(task => task.status === 'FAILED' && task.errorMessage !== '');
  }
}

export class Stage {
  constructor(prop) {
    this.stageId = prop.stageId;
    this.attempts = prop.attempts || [];// StageAttempt[]
  }

  get totalDuration() {
    let result = 0;
    for (let attempt of this.attempts) {
      result += attempt.duration;
    }
    return result;
  }

  getAttempt(attemptId) {
    return this.attempts[attemptId] || null;
  }

  getLastAttempt() {
    return this.getAttempt(this.attempts.length - 1);
  }

  getAllTasks() {
    let tasks = [];
    for (let attempt of this.attempts) {
      tasks = tasks.concat(attempt.tasks);
    }
    return tasks;
  }

  getAllSucceedTasks() {
    return this.getAllTasks().filter(t => t.status === 'SUCCESS');
  }

  // sometimes Stage info is missing in spark history server.
  static createDataMissingStage(stageId) {
    let stage = new Stage({ stageId: stageId });
    stage.attempts.push(StageAttempt.createDataMissingStageAttempt({ stageId: stageId }));
    return stage;
  }

  checkError() {
    if (this.attempts.length <= 0) {
      return false;
    }
    return this.attempts[this.attempts.length - 1].checkErrorInfo();
  }
}