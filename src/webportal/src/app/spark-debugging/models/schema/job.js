import { StageHelper, Stage } from './stage';
import { func } from 'prop-types';
import { ExecutionPlan, GenerateExecutionPlan } from './execution-plan';

export class JobHelper {
  static async getJobList(helper, applicationType, executorList) {
    // In fact, jobJson is a list of objects
    let jobJson = await helper.get('/jobs');
    jobJson = jobJson.sort((a, b) => a['jobId'] - b['jobId']);
    if (jobJson.length <= 0) {
      return [];
    }

    let executionPlan = GenerateExecutionPlan.getExecutionPlan(jobJson);
    let stageMap = new Map();

    try {
      if (executionPlan.useAllTaskAPI) {
        try {
          // In /allTasks API response data, stageId might neither start from 0 nor be continuous.
          // So use map instead of array to store the stage info.
          stageMap = await this.getStageMapFromAllTasks(helper, executorList, executionPlan);
        } catch (e) {
          console.log("Fetch allTask request with error " + e.message);
          jobJson = this.limitJobNumber(jobJson, applicationType);
          stageMap = await this.getStageMap(helper, jobJson, executorList);
        }
      }
      else {
        jobJson = this.limitJobNumber(jobJson, applicationType);
        stageMap = await this.getStageMap(helper, jobJson, executorList);
      }
    } catch (e) {
      console.log(e);
    }

    // jobJson and stageMap are not completely corresponding. There might be jobs with incomplete stage info. Drop jobs without stages
    let jobList = [];
    for (let job of jobJson) {
      let stages = job['stageIds'].map(stageId => stageMap.get(stageId)).filter(s => s !== undefined).sort((a, b) => a.stageId - b.stageId);
      if (stages.length > 0) {
        let batchId = null;
        if (applicationType === 'SparkStreaming') {
          // Get batchId from last stage's last attempt's description
          const regex = /\/streaming\/batch\/\?id\=(\d+)/;
          let attempts = stages[stages.length - 1].attempts;
          let match = regex.exec(attempts[attempts.length - 1].description);
          batchId = match ? Number(match[1]) : null;
          if (batchId === null) {
            console.warn(`No batchId info for job ${job.jobId}. Stages: `, stages); // If this happens, try to find another approach to get batchId
          }
        }

        jobList.push(new Job({
          jobId: job['jobId'],
          jobStatus: job['status'],
          stages: stages,
          stageId2InEdges : JobDagGraph.getJobStageDagGraph(job),
          batchId: batchId,
        }));
      }
    }
    return jobList;
  }

  static limitJobNumber(jobJson, applicationType) {
    const jobNumberMapping = {
      'SparkStreaming': 30,
      'SparkBatch': 20,
      'unknown': 20, // used when testing with old API. Can be removed later
    }
    let retainedJobNumber = jobNumberMapping[applicationType];
    console.debug(`retained ${retainedJobNumber} jobs`);
    return jobJson.slice(-retainedJobNumber); // retain last <retainedJobNumber> jobs, or all jobs if not enough.
  }

  static async getStageMap(helper, jobJson, executorList) {
    let stageIdSet = new Set();
    for (let s of jobJson) {
      for (let id of s['stageIds']) {
        stageIdSet.add(id);
      }
    }

    let stageMap = new Map();
    let promiseArr = [];
    for (let id of stageIdSet) {
      promiseArr.push(StageHelper.getStage(helper, id, executorList).then(x => x).catch(e => {
        console.log(e);
        return Stage.createDataMissingStage(id);
      }));
    }
    let results = await Promise.all(promiseArr);
    results.forEach(stage => stageMap.set(stage.stageId, stage));
    return stageMap;
  }

  static async getStageMapFromAllTasks(helper, executorList, executionPlan) {
    return await StageHelper.getStageMapFromAllTasks(helper, executorList, executionPlan);
  }
}

class JobDagGraph {
  // return Map<int, List<int>>  stageId -> inStageIdList
  static getJobStageDagGraph(jobJson) {
    let stageIds = jobJson['stageIds'].sort((a, b) => a - b);
    let stage2InEdges = new Map();
    if (!jobJson['stagesRddGraph']) {
      // old spark bits doesn't have this property, then organize the stage by the id order.
      // if the stageIds is [3,4,5,6], then graph will be  3->4->5->6
      for (let i = 0; i < stageIds.length; i++) {
        if (i == 0) {
          stage2InEdges.set(stageIds[i], []);
        } else {
          stage2InEdges.set(stageIds[i], [stageIds[i - 1]]);
        }
      }
    } else {
      // Spark job dag graph is for rdd, and currently we want to get the stage graph, so there are three steps to get the info.
      // 1. Get the rdd -> stageId info.
      // 2. Get the stage in edges by mapping stage incomming rddId to stage id.push
      let rddId2StageId = new Map();
      for (let stageRddGraph of jobJson['stagesRddGraph']) {
        let stageId = stageRddGraph['stageId'];
        for (let edge of stageRddGraph['edges']) {
          rddId2StageId.set(edge['fromId'], stageId);
          rddId2StageId.set(edge['toId'], stageId);
        }
      }

      for (let stageRddGraph of jobJson['stagesRddGraph']) {
        let stageId = stageRddGraph['stageId'];
        if (!stage2InEdges.has(stageId)) {
          stage2InEdges.set(stageId, []);
        }
        for (let inEdge of stageRddGraph['incomingEdges']) {
          stage2InEdges.get(stageId).push(rddId2StageId.get(inEdge['fromId']));
        }
      }
    }

    return stage2InEdges;
  }

}
class Job {
  constructor(prop) {
    this.jobId = prop.jobId;
    this.jobStatus = prop.jobStatus;
    this.stages = prop.stages || [];
    this.stageId2InEdges = prop.stageId2InEdges || new Map();// map<int, List<int>>  <5, [1,2,3]> means 1->5, 2->5, 3->5
    this.batchId = prop.batchId || null;
  }

  getStage(stageId) {
    return this.stages.find(s => s.stageId === stageId) || null;
  }

  getAllTasks() {
    let tasks = [];
    for (let stage of this.stages) {
      tasks = tasks.concat(stage.getAllTasks());
    }
    return tasks;
  }

  getAllStageLastAttempt() {
    let attempt = [];
    for (let stage of this.stages) {
      attempt.push(stage.getLastAttempt());
    }
    return attempt;
  }
}