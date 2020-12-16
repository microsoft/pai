class StageInfoForRumtime {
    constructor(prop) {
        this.name = prop.name;
        // Each below property looks like below 
        // duration = { max: maxValue, avg: avgValue, min: minValue}
        this.duration = prop.duration;
        this.gcTime = prop.gcTime;
        this.schedulerDelay = prop.schedulerDelay;
        this.inputSize = prop.inputSize;
        this.inputRecord = prop.inputRecord;
        this.outputSize = prop.outputSize;
        this.outputRecord = prop.outputRecord;
        this.shuffleReadSize = prop.shuffleReadSize;
        this.shuffleReadRecord = prop.shuffleReadRecord;
        this.shuffleWriteSize = prop.shuffleWriteSize;
        this.shuffleWriteRecord = prop.shuffleWriteRecord;
    }
}

export default class RuntimeHelper {
    static getStageInfoForRuntime(application) {
        let stages = []
        for (let job of application.jobs) {
            for (let stage of job.stages) {
                let stageAttempt = stage.getLastAttempt();
                if (!stageAttempt) {
                    continue;
                }
                // All operations could be optimized to O(n) if needed.
                let durationArr = stageAttempt.tasks.map(t => t.duration).sort((a, b) => a - b);
                let gcTimeArr = stageAttempt.tasks.map(t => t.jvmGcTime).sort((a, b) => a - b);
                let schedulerDelay = stageAttempt.tasks.map(t => t.schedulerDelay).sort((a, b) => a - b);
                let inputSizeArr = stageAttempt.tasks.map(t => t.readBytes).sort((a, b) => a - b);
                let inputRecordsArr = stageAttempt.tasks.map(t => t.recordsRead).sort((a, b) => a - b);
                let outputSizeArr = stageAttempt.tasks.map(t => t.bytesWritten).sort((a, b) => a - b);
                let outputRecordsArr = stageAttempt.tasks.map(t => t.recordsWritten).sort((a, b) => a - b);
                let shuffleReadSizeArr = stageAttempt.tasks.map(t => t.shuffleLocalBytesRead).sort((a, b) => a - b);
                let shuffleReadRecordsArr = stageAttempt.tasks.map(t => t.shuffleRecordsRead).sort((a, b) => a - b);
                let shuffleWriteSizeArr = stageAttempt.tasks.map(t => t.shuffleBytesWritten).sort((a, b) => a - b);
                let shuffleWriteRecordsArr = stageAttempt.tasks.map(t => t.shuffleRecordsWritten).sort((a, b) => a - b);
                stages.push(new StageInfoForRumtime({
                    name: 'Stage ' + stageAttempt.stageId + ' attempt ' + stageAttempt.attemptId,
                    duration: {
                        max: this.maxF(durationArr),
                        avg: this.avgF(durationArr),
                        min: this.minF(durationArr),
                        p50: this.p50F(durationArr),
                        p95: this.p95F(durationArr),
                    },
                    gcTime: {
                        max: this.maxF(gcTimeArr),
                        avg: this.avgF(gcTimeArr),
                        min: this.minF(gcTimeArr),
                        p50: this.p50F(gcTimeArr),
                        p95: this.p95F(gcTimeArr),
                    },
                    schedulerDelay: {
                        max: this.maxF(schedulerDelay),
                        avg: this.avgF(schedulerDelay),
                        min: this.minF(schedulerDelay),
                        p50: this.p50F(schedulerDelay),
                        p95: this.p95F(schedulerDelay),
                    },
                    inputSize: {
                        max: this.maxF(inputSizeArr),
                        avg: this.avgF(inputSizeArr),
                        min: this.minF(inputSizeArr),
                        p50: this.p50F(inputSizeArr),
                        p95: this.p95F(inputSizeArr),
                    },
                    inputRecord: {
                        max: this.maxF(inputRecordsArr),
                        avg: this.avgF(inputRecordsArr),
                        min: this.minF(inputRecordsArr),
                        p50: this.p50F(inputRecordsArr),
                        p95: this.p95F(inputRecordsArr),
                    },
                    outputSize: {
                        max: this.maxF(outputSizeArr),
                        avg: this.avgF(outputSizeArr),
                        min: this.minF(outputSizeArr),
                        p50: this.p50F(outputSizeArr),
                        p95: this.p95F(outputSizeArr),
                    },
                    outputRecord: {
                        max: this.maxF(outputRecordsArr),
                        avg: this.avgF(outputRecordsArr),
                        min: this.minF(outputRecordsArr),
                        p50: this.p50F(outputRecordsArr),
                        p95: this.p95F(outputRecordsArr),
                    },
                    shuffleReadSize: {
                        max: this.maxF(shuffleReadSizeArr),
                        avg: this.avgF(shuffleReadSizeArr),
                        min: this.minF(shuffleReadSizeArr),
                        p50: this.p50F(shuffleReadSizeArr),
                        p95: this.p95F(shuffleReadSizeArr),
                    },
                    shuffleReadRecord: {
                        max: this.maxF(shuffleReadRecordsArr),
                        avg: this.avgF(shuffleReadRecordsArr),
                        min: this.minF(shuffleReadRecordsArr),
                        p50: this.p50F(shuffleReadRecordsArr),
                        p95: this.p95F(shuffleReadRecordsArr),
                    },
                    shuffleWriteSize: {
                        max: this.maxF(shuffleWriteSizeArr),
                        avg: this.avgF(shuffleWriteSizeArr),
                        min: this.minF(shuffleWriteSizeArr),
                        p50: this.p50F(shuffleWriteSizeArr),
                        p95: this.p95F(shuffleWriteSizeArr),
                    },
                    shuffleWriteRecord: {
                        max: this.maxF(shuffleWriteRecordsArr),
                        avg: this.avgF(shuffleWriteRecordsArr),
                        min: this.minF(shuffleWriteRecordsArr),
                        p50: this.p50F(shuffleWriteRecordsArr),
                        p95: this.p95F(shuffleWriteRecordsArr),
                    },
                }));
            }

        }
        return stages;
    }
    static avgF(arr) {
        return arr.length === 0 ? '' : arr.reduce((a, b) => a + b) / arr.length;
    }
    /** arr should be a sorted array */
    static maxF(arr) {
        return arr.length === 0 ? '' : arr[arr.length - 1];
    }
    /** arr should be a sorted array */
    static minF(arr) {
        return arr.length === 0 ? '' : arr[0];
    }
    /** arr should be a sorted array */
    static p50F(arr) {
        return arr.length === 0 ? 0 : arr[Math.floor((arr.length - 1)*0.5)];
    }
    /** arr should be a sorted array */
    static p95F(arr) {
        return arr.length === 0 ? 0 :  arr[Math.floor((arr.length - 1)*0.95)];
    }
}