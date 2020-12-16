import { DiagnoseResult } from '../diagnostics/diagnostics'

export default class StreamingDiagnotor {
    constructor(fullAppId) {
        this.diagnoseResults = [
            new DiagnoseResult('Delay Skew', 'Batches with total delay N times longer than average', this.diagSkew,
                [new StreamingThresholdItem(fullAppId, 'DelaySkew', 'delayTimes', 5)]),

            new DiagnoseResult('Records Skew', 'Batches with records N times more than average', this.diagSkew,
                [new StreamingThresholdItem(fullAppId, 'RecordSkew', 'recordTimes', 5)]),

            new DiagnoseResult('TimeRange Selected', 'Batches in selected time range', this.diagSkew,
                [new StreamingThresholdItem(fullAppId, 'TimeRange', 'startTime', -1),
                new StreamingThresholdItem(fullAppId, 'TimeRange', 'endTime', -1)]),
        ];
        this.loaded = false;
    }

    hasSkew(batches) {
        this.updatedAllDignoseResult(batches);
        for (let diagRes of this.diagnoseResults) {
            if (diagRes.diagItemList.length > 0) {
                return true;
            }
        }
        return false;
    }

    updatedAllDignoseResult(batches) {
        if (batches === null || batches.length === 0 || this.loaded) {
            return;
        }

        for (let diagRes of this.diagnoseResults) {
            let ret = diagRes.funcName(batches, diagRes.thresholdItemList, diagRes.thresholdItemList[0].type);
            diagRes.diagItemList = ret;
        }
        this.loaded = true;
    }

    // used to update skew result
    // updateType: Delay Skew/Records Skew/TimeRange selected
    updateOneDignoseResult(batches, updateType, values) {
        let digRes = this.diagnoseResults.find(r => r.name === updateType);
        let thresholdItem = digRes.thresholdItemList;
        this.loaded = false;

        switch (updateType) {
            case 'Delay Skew':
                thresholdItem.find(t => t.name === 'delayTimes').setValue('delayTimes_' + values[0]);
                digRes.diagItemList = digRes.funcName(batches, thresholdItem, 'DelaySkew');
                break;
            case 'Records Skew':
                thresholdItem.find(t => t.name === 'recordTimes').setValue('recordTimes_' + values[0]);
                digRes.diagItemList = digRes.funcName(batches, thresholdItem, 'RecordSkew');
                break;
            case 'TimeRange Selected':
                thresholdItem.find(t => t.name === 'startTime').setValue('startTime_' + values[0]);
                thresholdItem.find(t => t.name === 'endTime').setValue('endTime_' + values[1]);
                digRes.diagItemList = digRes.funcName(batches, thresholdItem, 'TimeRange');
                break;
        }
    }

    diagSkew(batches, streamingThresholdItemList, skewType) {
        let microBatchTableItems = new Array();
        if (batches === null || batches.length === 0) return microBatchTableItems;
        // skewType: DelaySkew / RecordSkew / TimeRange         
        switch (skewType) {
            case 'DelaySkew':
                let skewTimes = streamingThresholdItemList.find(d => d.name === 'delayTimes').getValue();
                // to-do save sum as local cache
                let delayThreshold = (batches.map(b => b.totalDelay).reduce((a, b) => a + b, 0) / batches.length) * skewTimes;
                for (let batch of batches) {
                    if (batch.totalDelay >= delayThreshold) {
                        microBatchTableItems.push(new MicroBatchTableItem(batch));
                    }
                }
                break;
            case 'RecordSkew':
                let recordTimes = streamingThresholdItemList.find(d => d.name === 'recordTimes').getValue();
                let recordThreshold = (batches.map(b => b.inputSize).reduce((a, b) => a + b, 0) / batches.length) * recordTimes;
                for (let batch of batches) {
                    if (batch.inputSize >= recordThreshold) {
                        microBatchTableItems.push(new MicroBatchTableItem(batch));
                    }
                }
                break;
            case 'TimeRange':
                microBatchTableItems = getLimitedBatches(batches, streamingThresholdItemList);
                break;
        }
        return microBatchTableItems;
    }


}

function getLimitedBatches(batches, streamingThresholdItemList) {
    let startTime = streamingThresholdItemList.find(d => d.name === 'startTime').getValue();
    let endTime = streamingThresholdItemList.find(d => d.name === 'endTime').getValue();

    let microBatchTableItems = new Array();
    if (startTime < 0 && endTime < 0) {
        microBatchTableItems = getDefaultShowBatches(batches);
        if (microBatchTableItems.length > 0) {
            startTime = microBatchTableItems[microBatchTableItems.length - 1].batchTime;
            endTime = microBatchTableItems[0].batchTime;
            streamingThresholdItemList.find(d => d.name === 'startTime').setValue('startTime_' + startTime);
            streamingThresholdItemList.find(d => d.name === 'endTime').setValue('endTime_' + endTime);
        }
        return microBatchTableItems;
    } else {
        return getTimeRangeBatches(batches, startTime, endTime);
    }
}

function getDefaultShowBatches(batches) {
    let defaultNum = 100;
    let showBatchesNum = Math.min(defaultNum, batches.length);
    let showBatches = [];
    for (let i = 0; i < showBatchesNum; i++) {
        showBatches.push(new MicroBatchTableItem(batches[i]));
    }
    return showBatches;
}

function getTimeRangeBatches(batches, startTime, endTime) {
    let showBatches = [];
    for (let batch of batches) {
        if (batch.batchTime < startTime) {
            break;
        }
        if (batch.batchTime <= endTime) {
            showBatches.push(new MicroBatchTableItem(batch));
        }
    }
    return showBatches;
}

class StreamingThresholdItem {
    // type: delaySkew / recordSkew / timeRange
    constructor(fullAppId, type, name, value) {
        this.localStorageKey = fullAppId + "_" + type + "_" + name;
        this.name = name;
        this.value = window.localStorage.getItem(this.localStorageKey) || name + "_" + value;
        this.type = type;
    }

    getValue() {
        return this.value.replace(this.name + '_', '');
    }

    setValue(value) {
        if (this.value != value) {
            window.localStorage.setItem(this.localStorageKey, value);
            this.value = window.localStorage.getItem(this.localStorageKey);
            return true;
        }
        return false;
    }
}

export class MicroBatchTableItem {
    constructor(props) {
        this.batchTime = props.batchTime;
        this.bathId = props.batchId;
        this.records = props.inputSize;
        this.schedulingDelay = props.schedulingDelay;
        this.processingTime = props.processingTime;
        this.totalDelay = props.totalDelay;
        this.success = props.numCompletedOutputOps;
        this.total = props.numTotalOutputOps;
    }
}