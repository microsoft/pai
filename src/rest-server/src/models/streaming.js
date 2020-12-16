'use strict';
const marketEnv = require('@pai/config/mp/env-mp');
const config = require('@pai/config/index');
const logger = require('@pai/config/logger');
const fsAdaptor = require('@pai/utils/mp-storage');

async function getAllBatches(applicationId, attemptId = -1) {
    // 1. check object
    const object = await _constructObjectFromHdfsContent(applicationId, attemptId);
    if (object === null) {
        return [];
    }
    // 2. handle data
    let batchDuration = object.batchDuration;
    return object.waitingBatches.map((w) => _convertBatchInfo(w, 'WAITING', batchDuration))
        .concat(object.runningBatches.map((r) => _convertBatchInfo(r, 'RUNNING', batchDuration)))
        .concat(object.completedBatches.map((c) => _convertBatchInfo(c, 'COMPLETED', batchDuration)))
        .sort((a, b) => (a.batchId < b.batchId) ? 1 : -1);
}

async function getSpecificBatch(applicationId, attemptId = -1, batchId) {
    // 1. check object
    const object = await _constructObjectFromHdfsContent(applicationId, attemptId);
    if (object === null) {
        return null;
    }
    // 2. handle data
    let batch = object.completedBatches.find((c) => c.batchTime.split(' ')[0] === batchId);
    if (batch) {
        return _convertBatchInfo(batch);
    }
    batch = object.runningBatches.find((r) => r.batchTime.split(' ')[0] === batchId);
    if (batch) {
        return _convertBatchInfo(batch);
    }
    batch = object.waitingBatches.find((w) => w.batchTime.split(' ')[0] === batchId);
    if (batch) {
        return _convertBatchInfo(batch);
    }
    return null;
}

async function getReceivers(applicationId, attemptId = -1) {
    const object = await _constructObjectFromHdfsContent(applicationId, attemptId);
    if (object === null) {
        return [];
    }
    return _receivedRecordRateWithBatchTime(object);
}

async function getOperations(applicationId, attemptId, batchId) {
    const object = await _constructObjectFromHdfsContent(applicationId, attemptId);
    if (object === null) {
        return [];
    }

    const retainedBatches = object.waitingBatches.concat(object.runningBatches).concat(object.completedBatches);
    const batch = retainedBatches.find((b) => b.batchTime.split(' ')[0] === batchId);
    if (batch === undefined) {
        return [];
    }
    const outputOperations = batch.outputOperations;
    const outputOpIdSparkJobIdPairs = batch.outputOpIdSparkJobIdPairs;

    let operations = [];
    for (let index in outputOperations) {
        if ({}.hasOwnProperty.call(outputOperations, index)) {
            let op = outputOperations[index];
            let jobIds = [];
            if (outputOpIdSparkJobIdPairs) {
                outputOpIdSparkJobIdPairs.forEach((p) => {
                    if (p.outputOpId === op.outputOpId) {
                        jobIds.push(p.sparkJobId);
                    }
                });
            }
            operations.push({
                outputOpId: op.outputOpId,
                name: op.name,
                description: op.description,
                startTime: op.startTime,
                endTime: op.endTime,
                duration: op.endTime - op.startTime,
                failureReason: op.failureReason || null,
                jobIds: jobIds,
            });
        }
    }
    return operations;
}

async function _constructObjectFromHdfsContent(applicationId, attemptId = -1) {
    const filePath = _constructPath(applicationId, attemptId);
    let response;
    try {
        response = await fsAdaptor.readFileContentFromHdfsAsync(filePath);
    } catch (e) {
        logger.warn(`read file: ${filePath} failed`);
        throw new Error(`[WebHDFS] 404`);
    }
    const jsonString = await response.content;
    const jsonArray = jsonString.split('*');
    if (jsonArray === undefined) {
        return null;
    }
    const jsonSize = jsonArray.length;
    let obj = null;

    if (jsonArray.length === 0) {
        return obj;
    } else if (jsonArray.length === 1) {
        try {
            obj = JSON.parse(jsonArray[0]);
        } catch (error) {
            return null;
        }
    } else {
        let startReadLine = jsonSize - 1;
        try {
            if (jsonArray[startReadLine]) {
                // handle the last line is complete and end with *
                obj = JSON.parse(jsonArray[startReadLine]);
            } else {
                startReadLine -= 1;
                obj = JSON.parse(jsonArray[startReadLine]);
            }
        } catch (error) {
            try {
                // try to get 2-last line -- it should be a complete json string
                obj = JSON.parse(jsonArray[jsonSize - 2]);
            } catch (error) {
                return obj;
            }
        }
    }
    return obj;
}

function _constructPath(applicationId, attemptId = -1) {
    let mpEnvDict = marketEnv.parseIni();
    let hdfsUser = mpEnvDict['HDFS_USER'];
    let hdfsFolder = `${config.webHdfs}/webhdfs/v1/app-logs/spark-events`;
    let fileName = `streaming_${applicationId}`;
    if (attemptId !== -1) {
        fileName = `${fileName}_${attemptId}`;
    }
    return `${hdfsFolder}/${fileName}?op=OPEN&user.name=${hdfsUser}`;
}

function _receivedRecordRateWithBatchTime(object) {
    const retainedBatches = object.waitingBatches.concat(object.runningBatches).concat(object.completedBatches);
    let latestBatches = [];
    retainedBatches.forEach((b) => latestBatches = latestBatches.concat(_convertBatchToStreamingMap(b)));
    const streams = object.streams;
    const batchDuration = object.batchDuration;

    let result = streams.map((s) => {
        let eventArray = [];
        let eventSum = 0;
        latestBatches.filter((b) => b.streamId === s.streamId).forEach((fb) => {
            eventArray.push([parseInt(fb.batchId), fb.recordNum * 1000 / batchDuration]);
            eventSum += fb.recordNum;
        });
        return {
            streamId: s.streamId,
            streamName: s.name,
            avgEventRate: eventArray.length == 0 ? 0 : eventSum / eventArray.length,
            eventRates: eventArray,
        };
    });
    return result;
}

function _convertBatchToStreamingMap(batch) {
    const batchId = batch.batchTime.split(' ')[0];
    const streamIdToInputInfo = batch.streamIdToInputInfo;
    let arrayRes = [];
    for (let index in streamIdToInputInfo) {
        if ({}.hasOwnProperty.call(streamIdToInputInfo, index)) {
            arrayRes.push({
                batchId: batchId,
                streamId: streamIdToInputInfo[index].inputStreamId,
                recordNum: streamIdToInputInfo[index].numRecords,
            });
        }
    }
    return arrayRes;
}

function _convertBatchInfo(batch, status, batchDuration) {
    const batchId = parseInt(batch.batchTime.split(' ')[0]);
    return {
        batchId: batchId,
        batchTime: batchId,
        status: status,
        batchDuration: batchDuration,
        inputSize: _calInputSize(batch),
        schedulingDelay: batch.processingStartTime - batch.submissionTime,
        processingTime: batch.processingEndTime - batch.processingStartTime,
        totalDelay: batch.processingEndTime - batch.submissionTime,
        numTotalOutputOps: _dealFromOutputOps(batch, 'Total'),
        numActiveOutputOps: _dealFromOutputOps(batch, 'Active'),
        numCompletedOutputOps: _dealFromOutputOps(batch, 'Completed'),
        numFailedOutputOps: _dealFromOutputOps(batch, 'Failed'),
        inputMetaData: _getInputMetaData(batch),
        firstFailureReason: _getFirstFailReason(batch),
    };
}

function _calInputSize(batch) {
    const streamIdToInputInfo = batch.streamIdToInputInfo;
    let inputSize = 0;
    for (let index in streamIdToInputInfo) {
        if ({}.hasOwnProperty.call(streamIdToInputInfo, index)) {
            inputSize += streamIdToInputInfo[index].numRecords;
        }
    }
    return inputSize;
}

function _getInputMetaData(batch) {
    const streamIdToInputInfo = batch.streamIdToInputInfo;

    let array = [];
    for (let index in streamIdToInputInfo) {
        if ({}.hasOwnProperty.call(streamIdToInputInfo, index)) {
            let value = streamIdToInputInfo[index];
            array.push([value.inputStreamId, value.metaData.Description]);
        }
    }
    return array;
}

function _dealFromOutputOps(batch, dealType) {
    const outputOperations = batch.outputOperations;
    let result = 0;
    for (let index in outputOperations) {
        if ({}.hasOwnProperty.call(outputOperations, index)) {
            if (dealType === 'Active') {
                if (outputOperations[index].endTime) {
                    result += 1;
                }
            } else if (dealType === 'Failed') {
                if (outputOperations[index].failureReason) {
                    result += 1;
                }
            } else if (dealType === 'Completed') {
                if (outputOperations[index].failureReason === undefined &&
                    outputOperations[index].endTime === undefined) {
                    result += 1;
                }
            } else { // total
                result += 1;
            }
        }
    }
    return result;
}

function _getFirstFailReason(batch) {
    const outputOperations = batch.outputOperations;
    for (let index in outputOperations) {
        if ({}.hasOwnProperty.call(outputOperations, index)) {
            if (outputOperations[index].failureReason) {
                return outputOperations[index].failureReason;
            }
        }
    }
    return null;
}

module.exports = {
    getAllBatches,
    getReceivers,
    getOperations,
    getSpecificBatch,
};
