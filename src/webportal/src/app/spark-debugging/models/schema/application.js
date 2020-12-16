import * as axios from 'axios';
import {JobHelper} from './job';
import Executor from './executor';
import Diagnotor from '../diagnostics/diagnostics';
import {Batch} from './streaming/batch'
import {Receiver} from './streaming/receiver'
import StreamingDiagnotor from '../streaming/diagnosis'
import {getClientsForSelectedSubcluster, useProxy} from '../../../common/http-client';
import {getSelectedSubclusterConfig} from '../../../common/subcluster';

var enabledStreamingPersist = true;

const DataSources = {
  Yarn: 'Yarn',
  SparkHistoryServer: 'SparkHistoryServer',
};

// It seems that this is meant to be a factory class.
export class ApplicationHelper {
  constructor(jobInfo, attemptId) { // AttemptId can be null
    this.jobInfo = jobInfo;
    this.attemptId = attemptId;
    this._client = this._getClient();
    this._persistClient = this._getPersistClient();
    this._appInfo = null;
    this.progress = {
      downloadFinishedTotal: 0,
    };
  }

  get appInfo() {
    if (this._appInfo === null) {
      throw new Error('Helper not init');
    }
    return this._appInfo;
  }

  /** Application Id in yarn */
  get baseAppId() {
    return this.appInfo.appId;
  }

  /** [baseAppId] or [baseAppId]/[attemptId]. See rules on https://spark.apache.org/docs/latest/monitoring.html#rest-api. */
  get fullAppId() {
    return this.appInfo.getAppId(this.attemptId);
  }

  get isCompleted() {
    let jobStatus = this.jobInfo.jobStatus;
    return jobStatus === 'Succeeded' || jobStatus === 'Failed' || jobStatus === 'Stopped';
  }

  setAttemptId(attemptId) {
    this.attemptId = attemptId;
  }

  async init() {
    this._appInfo = await this._getApplicationInfo();
  }

  /** Data source for general info like jobs, executors */
  get dataSource() {
    if (this.jobInfo.jobStatus === 'Running') { // Retrieve data from Yarn AM for all running jobs.
      return DataSources.Yarn;
    } else { // Use spark history server for other cases
      return DataSources.SparkHistoryServer;
    }
  }

  get _pathPrefix() {
    // Path prefix for spark API
    return `/api/v1/applications/${this.fullAppId}`;
  }

  get _persistPathPrefix() {
    return `/api/v1/sparkHistoryServer/applications/${this.fullAppId}`;
  }

  /** Client to retrieve general info like jobs, executors */
  _getClient() {
    let client;
    if (this.dataSource === DataSources.Yarn) {
      // Retrieve job info from yarn proxy
      let yarnProxyUri = getSelectedSubclusterConfig().yarnProxyUri;
      let baseURL = `${yarnProxyUri}/proxy/${this.jobInfo.appId}`;
      client = axios.create({baseURL});
      client.interceptors.request.use(useProxy);
    } else if (this.dataSource === DataSources.SparkHistoryServer) { // Use spark history server for other cases
      client = getClientsForSelectedSubcluster().sparkJobHistoryClient;
    } else {
      throw new Error(`Unknown data source ${this.dataSource}`);
    }
    // Use cache for completed apps
    if (client.defaults.params === undefined) {
      client.defaults.params = {
        enableCache: this.isCompleted,
      };
    } else {
      client.defaults.params.enableCache = this.isCompleted;
    }
    return client;
  }

  /** Client to retrive persisted streaming info from completed jobs */
  _getPersistClient() {
    let client = getClientsForSelectedSubcluster().restServerClient;
    // Use cache for completed apps
    if (client.defaults.params === undefined) {
      client.defaults.params = {
        enableCache: this.isCompleted,
      };
    } else {
      client.defaults.params.enableCache = this.isCompleted;
    }
    return client;
  }

  async get(url, options) {
    let resp = await this._client.get(this._pathPrefix + url, options);
    return resp.data;
  }

  async getPersistData(url, options) {
    let resp = await this._persistClient.get(this._persistPathPrefix + url, options);
    return resp.data;
  }

  async getStreamingData(url, options) {
    if (this.isCompleted) {
      // For completed streaming job data, fetch from rest server
      return this.getPersistData(url, options);
    } else {
      // For running streaming job data, fetch from spark API on yarn
      return this.get(url, options);
    }
  }

  /**
   * 
   * @callback ProgressHandler
   * @param {Object} progress
   * @param {int} progress.loadingProgress
   * @param {int} progress.loadingDataSize
   */

  /**
   * 
   * @param {ProgressHandler} updateDownloadProgress
   */
  setDownloadProgressHander(updateDownloadProgress) {
    // Doesn't support concurrent downloading
    for (let client of [this._client, this._persistClient]) {
      client.defaults.onDownloadProgress = (event) => {
        if (event.target.readyState === 4) { // Download complete
          this.progress.downloadFinishedTotal += event.loaded;
          // event.total will be 0 when the server never sends a Content-Length header. Which prevents us to calculate progress.
          // Need to change server headers to fully support progress indicating.
          updateDownloadProgress({
            loadingProgress: -1,
            loadingDataSize: this.progress.downloadFinishedTotal,
          });
        } else { // Downloading
          updateDownloadProgress({
            loadingProgress: -1,
            loadingDataSize: this.progress.downloadFinishedTotal + event.loaded,
          })
        }
      }
    }
  }

  async _getApplicationInfo() {
    let appId = this.jobInfo.appId;
    let resp = await this._client.get(`/api/v1/applications/${this.jobInfo.appId}`);
    let json = resp.data;
    let appHisInfos = [];
    for (let attempt of json['attempts']) {
      appHisInfos.push(new AppHistoricalInfo(
        attempt['attemptId'],
        attempt['startTime'],
        attempt['endTime'],
        attempt['duration']));
    }
    return new ApplicationInfo(
      appId,
      json['applicationType'] || 'unknown',
      appHisInfos
    );
  }

  static assignTasksForExecutors(executors, tasks) {
    let executor2Tasks = new Map();
    for (let task of tasks) {
      if (executor2Tasks.has(task.host)) {
        executor2Tasks.get(task.host).push(task);
      } else {
        executor2Tasks.set(task.host, [task]);
      }
    }
    for (let executor of executors) {
      if (executor2Tasks.has(executor.host)) {
        executor.taskList = executor2Tasks.get(executor.host);
      }
    }
  }

  /** Fetch application data. Returns an "Application" instance. */
  async getApplication() {
    let applicationType = this.appInfo.applicationType;
    let isStreamingJob = applicationType === 'SparkStreaming';
    let batches;
    let receivers;
    if (isStreamingJob) {
      // Note: Need to fetch batch info first, or some latest batches will lack job info. It's ok for earlier jobs to lack job info, but it's neccessary for latest batches to have job info.
      try {
        batches = await this.fetchBatches();
        receivers = await this.fetchReceivers();
      } catch (err) {
        console.warn('Unable to fetch streaming data. Fall back to batch application. Err: ', err);
        isStreamingJob = false;
        enabledStreamingPersist = false;
      }
    }
    // Get data parts both applicable for streaming job and batch job
    let executorList = await Executor.asyncGetExecutors(this);
    let jobs = await JobHelper.getJobList(this, applicationType, executorList);
    let tasks = [];
    jobs.forEach(job => tasks = tasks.concat(job.getAllTasks()));
    ApplicationHelper.assignTasksForExecutors(executorList, tasks);
    let appEnvInfo = await AppEnvInfo.get(this);
    if (isStreamingJob) {
      return new StreamingApplication(this, applicationType, this.isCompleted, jobs, executorList, appEnvInfo, batches, receivers);
    } else {
      return new BatchApplication(this, applicationType, this.isCompleted, jobs, executorList, appEnvInfo);
    }
  }

  /* Functions for streaming applications */

  async fetchBatches() {
    let batchObjects = await this.getStreamingData('/streaming/batches');
    return batchObjects.map(batchObject => new Batch(batchObject));
  }

  async fetchReceivers() {
    let receiverObjects = await this.getStreamingData('/streaming/receivers');
    return receiverObjects.map(receiverObject => new Receiver(receiverObject));
  }
}

/**
 * Spark application environment info.
 */
export class AppEnvInfo {
  constructor(runtimeInformation, sparkProperties, systemProperties, classpathEntries) {
    // Legacy code. Reserve for compatibility
    this.executorCores = sparkProperties['spark.executor.cores'] || 1;
    this.executorNum = sparkProperties['spark.executor.instances'] || 2;
    this.dynamicAllocationEnabled = (sparkProperties['spark.dynamicAllocation.enabled'] === 'true') || false;
    this.dynamicAllocationMaxExecutors = sparkProperties['spark.dynamicAllocation.maxExecutors'] || null;
    this.taskCores = sparkProperties['spark.task.cpus'] || 1;
    // All properties read from spark /environment API
    /**
     * @type {object}
     * key value map of runtimeInformation
     */
    this.runtimeInformation = runtimeInformation;
    /**
     * @type {object}
     * key value map of spark config properties
     */
    this.sparkProperties = sparkProperties;
    /**
     * @type {object}
     * key value map of system properties
     */
    this.systemProperties = systemProperties;
    /**
     * @typedef Classpath
     * @type {object}
     * @property {string} resource - The real path
     * @property {string} source - Where does it come from
     */
    
    /**
     * @type {Array.<Classpath>}
     */
    this.classpathEntries = classpathEntries;
  }

  static async get(helper) {
    // Environment will not change so always use cache.
    let data = await helper.get('/environment', {
      params: {
        enableCache: true,
      },
    });
    let runtimeInformation = data.runtime;
    let sparkProperties = Object.fromEntries(data.sparkProperties);
    let systemProperties = Object.fromEntries(data.systemProperties);
    let classpathEntries = data.classpathEntries.map(([resource, source]) => ({resource, source}));
    return new AppEnvInfo(runtimeInformation, sparkProperties, systemProperties, classpathEntries);
  }
}

export class AppHistoricalInfo {
  constructor(attemptId, startTime, endTime, duration) {
    this.attemptId = attemptId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = duration;
  }
}

/** Class to contain basic spark app info. */
export class ApplicationInfo {
  constructor(appId, applicationType, appHistoricalInfo) {
    this.appId = appId;
    this.applicationType = applicationType;
    this.appHistoricalInfo = appHistoricalInfo || [];
    this.isAttemptIdNull = ((appHistoricalInfo) && (appHistoricalInfo.length === 1) && 
        ((appHistoricalInfo[0].attemptId === null) || (appHistoricalInfo[0].attemptId === undefined))) ? true : false;
  }

  /** Get app id used in spark rest api */
  getAppId(attemptId) {
    if (this.isAttemptIdNull) {
      return this.appId;
    }

    if (attemptId === null || attemptId === undefined || this.appHistoricalInfo.length == 0) {
      return this.appId;
    }

    if (this.appHistoricalInfo.some((x) => x.attemptId === attemptId.toString())) {
      return this.appId + '/' + attemptId;
    }
    return this.appId;
  }
}

// This class is meant to be a data container. Try to prefetch all data when constructing instance if possible.
export class Application {
  constructor(helper, applicationType, isCompleted, jobs, executorList, appEnvInfo) {
    this.helper = helper;
    this.applicationId = this.helper.appInfo.appId; // Not used yet...
    this.applicationType = applicationType;
    this.isCompleted = isCompleted;
    this.jobs = jobs || [];
    this.executorList = executorList || [];
    this.appEnvInfo = appEnvInfo || null;
    this.diagnotor = new Diagnotor(helper.fullAppId);
    this.hasError = false;
  }

  getJob(jobId) {
    return this.jobs.find(job => job.jobId === jobId) || null;
  }

  getPageType() {
    if (this.applicationType == 'SparkStreaming' && enabledStreamingPersist) {
      return 'Streaming';
    } else {
      return 'Batch';
    }
  }

  getAllTasks() {
    let tasks = [];
    for (let job of this.jobs) {
      tasks = tasks.concat(job.getAllTasks());
    }
    return tasks;
  }

  getSpecifyStage(stageId) {
    for (let job of this.jobs) {
      let stages = job.stages;
      for (let st of stages) {
        if (st.stageId == stageId) {
          return st;
        }
      }
    }
    return null;// todo: not return null
  }

  getAllStages() {
    let stages = [];
    for (let job of this.jobs) {
      stages = stages.concat(job.stages);
    }
    return stages;
  }

  getAllFailJobs() {
    let failJobs = [];
    failJobs = this.jobs.filter(j => j.jobStatus === 'FAILED');
    return failJobs;
  }

  getSpecifyJobStages(jobId) {
    for (let job of this.jobs) {
      if (jobId === job.jobId) {
        return job.stages;
      }
    }
    return [];
  }

  _getStageSimpleInfo(job) {
    return job.stages.map(
      (s) => s.getLastAttempt()
    ).filter(
      lastAttempt => lastAttempt !== null
    ).map((lastAttempt) => ({
      text: 'Stage ' + lastAttempt.stageId,
      key: lastAttempt.stageId,
      status: lastAttempt.status,
      attemptId: lastAttempt.attemptId,
      jobId: job.jobId,
      name: lastAttempt.name,
      failureReason: lastAttempt.failureReason,
      details: lastAttempt.details,
    }));
  }

  getAllStageLastAttemptSimpleInfo() {
    return this.jobs.flatMap(this._getStageSimpleInfo);
  }

  getSpecifyJobStagesSimpleInfo(jobId) {
    for (let job of this.jobs) {
      if (job.jobId === jobId) {
        return this._getStageSimpleInfo(job);
      }
    }
    return [];
  }

  getAllExecutorSimpleInfo() {
    let executorArray = []
    for (let exe of this.executorList) {
      if (exe.id !== "driver") {
        executorArray = executorArray.concat({
          text: 'executor ' + exe.id,
          key: exe.id,
          stderr: exe.stderr,
          stdout: exe.stdout
        });
      }
    }
    return executorArray;
  }

  updateDiagResults(diagKey = null) {
    this.diagnotor.clear(diagKey);
    if (!this.isCompleted) {
      return;
    }

    let stages = this.getAllStages();
    for (let stage of stages) {
      let stageAttempt = stage.getLastAttempt();
      if (stageAttempt) {
        stageAttempt.hasSkew = (stageAttempt.status !== 'COMPLETE') ? false : this.diagnotor.updateDiagResults(stageAttempt, diagKey);
      }
    }
    return;
  }

  checkError() {
    this.hasError = false;
    let stages = this.getAllStages();
    for (let stage of stages) {
      this.hasError = stage.checkError() || this.hasError;
    }
  }

  hasSkew() {
    return this.diagnotor.hasSkew();
  }
}

export class BatchApplication extends Application {};

export class StreamingApplication extends Application {
  constructor(helper, applicationType, isCompleted, jobs, executorList, appEnvInfo, batches, receivers) {
    super(helper, applicationType, isCompleted, jobs, executorList, appEnvInfo);
    this.batches = batches || [];
    this.receivers = receivers || [];
    this.streamingDiagnotor = new StreamingDiagnotor(helper.fullAppId); 
  }

  getStreamingDiagnotorResults(){
    this.streamingDiagnotor.updatedAllDignoseResult(this.batches);
    return this.streamingDiagnotor.diagnoseResults;
  }

  updateStreamingDiagnotorCondition(updateType, values){
    this.streamingDiagnotor.updateOneDignoseResult(this.batches, updateType, values);
    return this.streamingDiagnotor.diagnoseResults;
  }

  hasStreamingSkew(){
    return this.streamingDiagnotor.hasSkew(this.batches);
  }

  getFailBatches() {
    return Array.isArray(this.batches) ? this.batches.filter(b => b.numFailedOutputOps !== 0) : [];
  }

  hasStreamingError() {
    return this.getFailBatches.length > 0
  }

  // Fetching jobIds needs one call for each batch, so jobIds can't be prefetched. Use this method when needed.
  async getJobsByBatchId(batchId) {
    if (this.batches === null || this.batches.length === 0) return [];
    let batchInfo = this.batches.find(b => b.batchId === batchId);
    if (batchInfo === undefined) {
      return [];
    } else {
      // fetch jobIds using /operations API
      try {
        let operations = await this.helper.getStreamingData(`/streaming/batches/${batchId}/operations`);
        let jobIds = operations.flatMap(operation => operation.jobIds);
        return this.jobs.filter(j => jobIds.includes(j.jobId));
      } catch (e) {
        console.warn(`Unable to fetch batch [${batchId}]'s jobIds. Error: `, e);
        throw new Error(`Batch [${batchId}]'s not found`)
      }
    }
  }

  async getStageSimpleInfosByBatchId(batchId){
    let jobs = await this.getJobsByBatchId(batchId);
    return jobs.flatMap(job => this.getSpecifyJobStagesSimpleInfo(job.jobId));
  }

  async getBatchInputMetadata(batchId) {
    try {
      let batchInfo = await this.helper.getStreamingData(`/streaming/batches/${batchId}`);
      return batchInfo.inputMetaData;
    } catch (e) {
      console.warn(`Unable to fetch batch [${batchId}]'s metaData. Error: `, e);
      throw new Error(`Batch [${batchId}]'s metadata can not be found`);
    }
  }
}