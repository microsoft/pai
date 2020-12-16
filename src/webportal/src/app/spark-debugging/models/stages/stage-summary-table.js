export default class StageSummaryTable {
    static async getStageSummaryData(helper, stageId, stageAttemptId) {
        // url need parameter
        // 1. appId 2. app attempt Id 3. stageId 4. stage attemptId
        try{
            let resultObj = await helper.get(`/stages/${stageId}/${stageAttemptId}/taskSummary?quantiles=0.01,0.25,0.5,0.75,1.0`);
            let tableData = new Array();
            let durationArr = resultObj["executorRunTime"];
            let schedulerDelayArr = resultObj["schedulerDelay"];
            let taskDeTimeArr = resultObj["executorDeserializeTime"];
            let jvmGcTimeArr = resultObj["jvmGcTime"];
            let resultSerTimeArr = resultObj["resultSerializationTime"];
            let getResultTime = resultObj["gettingResultTime"];
            let peakMemArr = resultObj["peakExecutionMemory"];
            let inputMetrics = resultObj["inputMetrics"];
    
            if (inputMetrics != null) {
                var bytesReadArr = inputMetrics["bytesRead"];
                var recordsArr = inputMetrics["recordsRead"];
            }
    
            for (let i = 0; i < 5; i++) {
                let stageSummary = new StageSummary();
                if (durationArr != null && durationArr.length != 0) {
                    stageSummary.duration = durationArr[i];
                }
                if (schedulerDelayArr != null && schedulerDelayArr.length != 0) {
                    stageSummary.schedulerDelay = schedulerDelayArr[i];
                }
                if (taskDeTimeArr != null && taskDeTimeArr.length != 0) {
                    stageSummary.taskDesTime = taskDeTimeArr[i];
                }
                if (jvmGcTimeArr != null && jvmGcTimeArr.length != 0) {
                    stageSummary.jvmGcTime = jvmGcTimeArr[i];
                }
                if (resultSerTimeArr != null && resultSerTimeArr.length != 0) {
                    stageSummary.resultSeriTime = resultSerTimeArr[i];
                }
                if (getResultTime != null && getResultTime.length != 0) {
                    stageSummary.getResultTime = getResultTime[i];
                }
                if (peakMemArr != null && peakMemArr.length != 0) {
                    stageSummary.peakExecutionMemory = durationArr[i];
                }
                if (bytesReadArr != null && bytesReadArr.length != 0) {
                    stageSummary.inputSize = bytesReadArr[i];
                }
                if (recordsArr != null && recordsArr.length != 0) {
                    stageSummary.records = recordsArr[i];
                }
                tableData.push(stageSummary);
            }
            return tableData;
        }
        catch(e){
            console.log("getsummary:" + e);
            return new Array();
        }
    }
}

class StageSummary {
    constructor(duration, schedulerDelay, taskDesTime, jvmGcTime, resultSeriTime,
        getResultTime, peakExecutionMemory, inputSize, records) {
        this.duration = duration;
        this.schedulerDelay = schedulerDelay;
        this.taskDesTime = taskDesTime;
        this.jvmGcTime = jvmGcTime;
        this.resultSeriTime = resultSeriTime;
        this.getResultTime = getResultTime;
        this.peakExecutionMemory = peakExecutionMemory;
        this.inputSize = inputSize;
        this.records = records;
    }
}


