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
const VirtualCluster = require('../models/vc');
const createError = require('../util/error');

/**
 * Load virtual cluster and append to req.
 */
const load = (req, res, next, vcName) => {
  new VirtualCluster(vcName, (vcInfo, error) => {
    if (error) {
      return next(createError.unknown(error));
    }
    req.vc = vcInfo;
    return next();
  });
};

/**
 * Get virtual cluster status.
 */
const get = (req, res) => {
  return res.json(req.vc);
};

/**
 * Get all virtual clusters info.
 */
const list = (req, res, next) => {
  VirtualCluster.prototype.getVcList((vcList, err) => {
    if (err) {
      return next(createError.unknown(err));
    } else if (vcList === undefined) {
      // Unreachable
      // logger.warn('list virtual clusters error, no virtual cluster found');
      // return res.status(500).json({
      //   error: 'VirtualClusterListNotFound',
      //   message: 'could not find virtual cluster list',
      // });
    } else {
      return res.status(200).json(vcList);
    }
  });
};

// module exports
module.exports = {
  load,
  get,
  list,
};
