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
'use strict';

// module dependencies
const subClusters = require('@pai/config/subclusters.config');
const createError = require('@pai/utils/error');
const subClustersModel = require('@pai/models/subCluster');
const config = require('@pai/config/index');

/**
 * Get the list of subClusters.
 */

const list = async (req, res, next) => {
  try {
    const fileUploadMethod = config.fileUploadMethod;
    let clusters = subClusters.Clusters;
    let result = [];
    let listAllSubcluster = false;
    if (req.query.hasOwnProperty('type') && req.query['type'] === 'all') {
      listAllSubcluster = true;
    }
    let subClustersSet = new Set(config.subClusters.split(','));
    for (let index = 0; index < clusters.length; index++) {
      if (!listAllSubcluster && clusters[index].hasOwnProperty('subCluster')
        && !subClustersSet.has(clusters[index].subCluster)) {
        continue;
      }
      clusters[index]['FileUploadMethod'] = fileUploadMethod;
      result.push(clusters[index]);
    }

    return res.status(200).json({Clusters: result});
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const listVirtualClusters = async (req, res, next) => {
  try {
    const data = await subClustersModel.listVirtualClusters();
    res.status(200).json(data);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

const listClusterSchedulers = async (req, res, next) => {
  try {
    const data = await subClustersModel.listAllClusterSchedulers();
    res.status(200).json(data);
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// module exports
module.exports = {
  list,
  listVirtualClusters,
  listClusterSchedulers,
};
