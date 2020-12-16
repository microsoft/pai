export class GenerateExecutionPlan {
  static DefaultTimeout() {
    return 30000; //  0.5 min
  }
  static LightWeigthTaskCountThreshold() {
    return 400;
  }
  static StageCountThreshold() {
    return 3;
  }
  static LargeStageThreshold() {
    return 1000;
  }
  static HeavyStageThreshold() {
    return 30000;
  }

  // Light weight EP to handle total task < LightWeigthTaskCountThreshold
  // Use getAllTask API without cache in proxy 
  static LightWeightEP() {
    return new ExecutionPlan(true, this.DefaultTimeout());
  }

  // MaxTaskPerStage < LargeStageThreshold
  // Use getAllTask API with cache in proxy 
  static LightStageEP() {
    return new ExecutionPlan(true, this.DefaultTimeout());
  }

  // It the job has at least one stage > HeavyStageThreshold (this case all task api cannot be use)
  // or maxTaskPerStge > LargeStageThreshold && stage count < StageCountThreshold
  // Use for each to get data and with cache in proxy
  static HeavyStageEP() {
    return new ExecutionPlan(false, this.DefaultTimeout());
  }

  // All stages in this job without task count > HeavyStageThreshold
  // but has stage with task > LargeStageThreshold and stage count  >  StageCountThreshold
  // Usually this kind of task is the biggest one
  static HugeJobEP() {
    return new ExecutionPlan(true, this.DefaultTimeout() * 2);
  }


  static getExecutionPlan(jobJson) {
    let maxStageId = -1;
    let totalTasksCount = 0;
    let maxTaskPerStage = -1;
    let stageCount = jobJson.length;

    jobJson.forEach(item => {
      totalTasksCount += item['numTasks'];
      maxTaskPerStage = maxTaskPerStage > item['numTasks'] ? maxTaskPerStage : item['numTasks'];
      for (let stageId of item['stageIds']) {
        maxStageId = stageId > maxStageId ? stageId : maxStageId;
      }
    });

    let ep = this.LightWeightEP();
    if (totalTasksCount > this.LightWeigthTaskCountThreshold()) {
      if (maxTaskPerStage > this.HeavyStageThreshold()) {
        ep = this.HeavyStageEP();
      }
      else if (maxTaskPerStage <= this.LargeStageThreshold()) {
        ep = this.LightStageEP();
      }
      else if (stageCount < this.StageCountThreshold()) {
        ep = this.HeavyStageEP();
      }
      else {
        ep = this.HugeJobEP();
      }
    }
    ep.updateMaxStageId(maxStageId);

    return ep;
  }

}

export class ExecutionPlan {
  constructor(useAllTaskAPI, timeout) {
    this.useAllTaskAPI = useAllTaskAPI;
    this.allTaskTimeout = timeout;
    this.maxStageId = 0;
  }


  updateMaxStageId(maxStageId) {
    this.maxStageId = maxStageId;
  }

}