// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// module dependencies
const historyModel = require('@pai/models/v2/history');
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');

/** 
 *  GET Framework All History Snapshots by FrameworkNamespace & FrameworkName
 */
const getFrameworkByName = asyncHandler(async (req, res) => {
  const frameworkNamespace = req.params.frameworkNamespace;
  const frameworkName = req.params.frameworkName;
  const result = await historyModel.getFrameworkByName(frameworkNamespace, frameworkName);
  return res.status(result.status).json(result.data);
});

/** 
 *  GET Framework All History Snapshots by FrameworkUID 
 */
const getFrameworkByUID = asyncHandler(async (req, res) => {
  const frameworkUID = req.params.frameworkUID;
  const result = await historyModel.getFrameworkByUID(frameworkUID);
  return res.status(result.status).json(result.data);
});

/** 
 *  GET Framework One Attempt History Snapshot by FrameworkNamespace & FrameworkName & FrameworkAttemptID
 */
const getFramworkByNameAndAttemptID = asyncHandler(async (req, res) => {
  const frameworkNamespace = req.params.frameworkNamespace;
  const frameworkName = req.params.frameworkName;
  const frameworkAttemptID= req.params.frameworkAttemptID;
  const result = await historyModel.getFrameworkByNameAndAttemptID(frameworkNamespace, frameworkName, frameworkAttemptID);
  return res.status(result.status).json(result.data);
});

/** 
 *  GET Framework One Attempt History Snapshot by FrameworkUID & FrameworkAttemptID
 */
const getFramworkByUIDAndAttemptID = asyncHandler(async (req, res) => {
  const frameworkUID = req.params.frameworkUID;
  const frameworkAttemptID= req.params.frameworkAttemptID;
  const result = await historyModel.getFrameworkByUIDAndAttemptID(frameworkUID, frameworkAttemptID);
  return res.status(result.status).json(result.data);
});

/**
 *  GET Pod All History by PodNamespace & PodName
 */
const getPodByName = asyncHandler(async (req, res) => {
  const podNamespace = req.params.podNamespace;
  const podName = req.params.podName;
  const result = await historyModel.getPodByName(podNamespace, podName);
  return res.status(result.status).json(result.data);
});

/**
 *  GET Pod All History by PodUID
 */
const getPodByUID = asyncHandler(async (req, res) => {
  const podUID = req.params.podUID;
  const result = await historyModel.getPodByUID(podUID);
  return res.status(result.status).json(result.data);
});

/**
 *  GET Pod Last History by PodNamespace & PodName
 */
const getPodByNameLast = asyncHandler(async (req, res) => {
  const podNamespace = req.params.podNamespace;
  const podName = req.params.podName;
  const result = await historyModel.getPodByNameLast(podNamespace, podName);
  return res.status(result.status).json(result.data);
});

/**
 *  GET Pod Last History by PodUID
 */
const getPodByUIDLast = asyncHandler(async (req, res) => {
  const podUID = req.params.podUID;
  const result = await historyModel.getPodByUIDLast(podUID);
  return res.status(result.status).json(result.data);
});

// module exports
module.exports = {
  getFrameworkByName,
  getFrameworkByUID,
  getFramworkByNameAndAttemptID,
  getFramworkByUIDAndAttemptID,
  getPodByName,
  getPodByUID,
  getPodByNameLast,
  getPodByUIDLast,
};