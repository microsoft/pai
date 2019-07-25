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
const util = require('util');
const createError = require('@pai/utils/error');
const vcConfig = require('@pai/config/vc');


class VirtualCluster {
  constructor() {
    this.resourceUnits = vcConfig.resourceUnits;
  }

  getResourceUnits() {
    return this.resourceUnits;
  }

  getVcList() {
    throw createError('Bad Request', 'NotImplementedError', 'getVcList not implemented in k8s');
  }

  getVc() {
    throw createError('Bad Request', 'NotImplementedError', 'getVc not implemented in k8s');
  }

  updateVc() {
    throw createError('Bad Request', 'NotImplementedError', 'updateVc not implemented in k8s');
  }

  stopVc() {
    throw createError('Bad Request', 'NotImplementedError', 'stopVc not implemented in k8s');
  }

  activeVc() {
    throw createError('Bad Request', 'NotImplementedError', 'activeVc not implemented in k8s');
  }

  removeVc() {
    throw createError('Bad Request', 'NotImplementedError', 'removeVc not implemented in k8s');
  }
}

const vc = new VirtualCluster();

// module exports
module.exports = {
  list: () => util.promisify(vc.getVcList.bind(vc))()
    .then((vcList) => vcList)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  get: (vcName) => util.promisify(vc.getVc.bind(vc))(vcName)
    .then((vcInfo) => vcInfo)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  getResourceUnits: vc.getResourceUnits.bind(vc),
  update: (vcName, vcCapacity, vcMaxCapacity) => util.promisify(vc.updateVc.bind(vc))(vcName, vcCapacity, vcMaxCapacity)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  stop: (vcName) => util.promisify(vc.stopVc.bind(vc))(vcName)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  activate: (vcName) => util.promisify(vc.activeVc.bind(vc))(vcName)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  remove: (vcName) => util.promisify(vc.removeVc.bind(vc))(vcName)
    .catch((err) => {
      throw createError.unknown(err);
    }),
};
