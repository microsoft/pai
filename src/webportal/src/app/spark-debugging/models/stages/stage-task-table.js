export default class StageTaskDetail {
    static getStageTaskData(stageId, stage_attempId, applicaiton) {
        let stage = applicaiton.getSpecifyStage(stageId);
        if (stage == null || stage.attempts==null ||stage.attempts.length == 0) {
          return [];
        }
        
        return stage.attempts.find(s=>s.attemptId==stage_attempId).tasks;
    }

    static resolveExecutorLogs(executors) {
        let executorMap = new Map();

        for (let i = 0; i < executors.length; i++) {
            let executor = executors[i];
            let executorId = executor["id"];
            let executorLogs = executor["executorLogs"];
            executorMap.set(executorId, executorLogs);
        }
        return executorMap;
    }

    static resolveTaskData(oneTask) {
        let index = oneTask["index"];
        let taskId = oneTask["taskId"];
        let attempt = oneTask["attempt"];
        let launchTime = oneTask["launchTime"];
        let duration = oneTask["duration"];
        let executorId = oneTask["executorId"];
        let host = oneTask["host"];
        let status = oneTask["status"];
        let taskLocality = oneTask["taskLocality"];
        let speculative = oneTask["speculative"];
        let accumulatorUpdates = oneTask["accumulatorUpdates"];
        let errorMessage = oneTask["errorMessage"];
        let taskMetrics = oneTask["taskMetrics"];
        if (taskMetrics != null) {
            var jvmGcTime = taskMetrics["jvmGcTime"];
            let inputMetrics = taskMetrics["inputMetrics"];
            if (inputMetrics != null) {
                var bytesRead = (inputMetrics["bytesRead"] / 1024 / 1024).toFixed(2);
                var records = inputMetrics["recordsRead"];
            }
        }

        return new TaskInfo(index, taskId, attempt, launchTime, duration,
            executorId, host, status, taskLocality, speculative, accumulatorUpdates,
            errorMessage, jvmGcTime, bytesRead, records);
    }
}

class TaskInfo {
    constructor(index, taskId, attempt, launchTime, duration, executorId, host, status, taskLocality, speculative,
        accumulatorUpdates, errorMessage, jvmGcTime, bytesRead, records, logs) {
        this.index = index;
        this.taskId = taskId;
        this.attempt = attempt;
        this.launchTime = launchTime;
        this.duration = duration;
        this.executorId = executorId;
        this.host = host;
        this.status = status;
        this.taskLocality = taskLocality;
        this.speculative = speculative;
        this.accumulatorUpdates = accumulatorUpdates;
        this.errorMessage = errorMessage;
        this.jvmGcTime = jvmGcTime;
        this.bytesRead = bytesRead;
        this.records = records;
        this.logs = logs;
    }
}

