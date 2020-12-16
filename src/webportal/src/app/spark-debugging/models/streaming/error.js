import FuzzySet from 'fuzzyset.js';

export default class SparkStreamingErrors {

    static getAllErrorInfos(application) {
        const fuzzyThreshold = 0.8;
        const maxErrorMsgCount = 2000;
        const maxMessageLenght = 500;

        let allErrorInfos = new Array();
        let failJobs = application.getAllFailJobs();
        for (let job of failJobs) {
            let failStages = application.getSpecifyJobStages(job.jobId);
            for (let stage of failStages) {
                let failStageAttempts = stage.attempts.filter(s => s.status === 'FAILED');
                for (let attempt of failStageAttempts){
                    allErrorInfos.push(new StreamingErrorInfo(stage.stageId, attempt.attemptId,
                        job.jobId, job.batchId, attempt.failureReason));
                    if (allErrorInfos.length >= maxErrorMsgCount) {
                        break;
                    }
                }
            }
        }
    
        let fuzzyErrors = FuzzySet();
        return _.groupBy(allErrorInfos, function (error) {
            let msg = error.errorMessage.length <= maxMessageLenght ? error.errorMessage : error.errorMessage.substring(0, maxMessageLenght) + '...';
            let matched = fuzzyErrors.get(msg, null, fuzzyThreshold);
            if (matched) {
                return matched["0"][1];
            }
            fuzzyErrors.add(msg);
            return error.errorMessage;
        });
    }

    static getErrorTableData(errorGroups){
        let aggErrorInfos = new Array();
        for (let eIndex in errorGroups) {
            let errorArray = new Array();
            errorGroups[eIndex].map(x => {
                errorArray.push({
                    'StageID': x.stageId,
                    'AttemptId': x.stageAttemptId,
                    'JobID': x.jobId,
                    'BatchTime': x.batchTime,
                    'ErrorMessage': x.errorMessage,
                });
            });
            aggErrorInfos.push({ 'errorMsg': eIndex, 'errorArray': errorArray });
        }
        return aggErrorInfos;
    }
}

class StreamingErrorInfo{
    constructor(stageId, stageAttemptId, jobId, batchTime, errorMessage){
        this.stageId = stageId;
        this.stageAttemptId = stageAttemptId;
        this.jobId = jobId;
        this.batchTime = batchTime;
        this.errorMessage = errorMessage;
    }
}

