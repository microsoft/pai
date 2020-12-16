'use strict';
const streaming = require('@pai/models/streaming');
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const createError = require('@pai/utils/error');

const getBatches = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getAllBatches(req.params.applicationId, -1);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Config of job ${req.params.frameworkName} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

const getBatchesWithAttempt = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getAllBatches(req.params.applicationId, req.params.attemptId);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Streaming data of job ${req.params.applicationId} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

const getReceivers = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getReceivers(req.params.applicationId, -1);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Streaming data of job ${req.params.applicationId} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

const getReceiversWithAttempt = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getReceivers(req.params.applicationId, req.params.attemptId);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Streaming data of job ${req.params.applicationId} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

const getOperations = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getOperations(req.params.applicationId, -1, req.params.batchId);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Streaming data of job ${req.params.applicationId} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

const getOperationsWithAttempt = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getOperations(req.params.applicationId, req.params.attemptId, req.params.batchId);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Streaming data of job ${req.params.applicationId} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

const getSpecificBatch = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getSpecificBatch(req.params.applicationId, -1, req.params.batchId);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Streaming data of job ${req.params.applicationId} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

const getSpecificBatchWithAttempt = asyncHandler(async (req, res) => {
    try {
        const data = await streaming.getSpecificBatch(req.params.applicationId,
            req.params.attemptId, req.params.batchId);
        res.status(200).send(data);
    } catch (error) {
        if (error.message.startsWith('[WebHDFS] 404')) {
            throw createError('Not Found', 'NoHDFSFile', `Streaming data of job ${req.params.applicationId} is not found.`);
        } else {
            throw createError.unknown(error);
        }
    }
});

module.exports = {
    getBatches,
    getBatchesWithAttempt,
    getReceivers,
    getReceiversWithAttempt,
    getOperations,
    getOperationsWithAttempt,
    getSpecificBatch,
    getSpecificBatchWithAttempt,
};
