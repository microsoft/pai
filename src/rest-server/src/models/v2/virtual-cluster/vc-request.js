// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const axios = require('axios');
const yaml = require('js-yaml');
const createError = require('@pai/utils/error');
const { resourceUnits } = require('@pai/config/vc');
const { enabledHived, hivedWebserviceUri } = require('@pai/config/launcher');
const kubernetes = require('@pai/models/kubernetes/kubernetes');
const k8s = require('@pai/utils/k8sUtils');

const listRequest = async (vcName) => {
  const vcInfos = await getVcList();
  if (!Object.prototype.hasOwnProperty.call(vcInfos, vcName)) {
    throw createError(
      'Not Found',
      'NoVirtualClusterError',
      `Vc ${vcName} not found`,
    );
  }
  return vcInfos[vcName];
};

// module exports
module.exports = {
  create: createRequest,
  list: listRequest,
  update: updateRequest,
  delete: deleteRequest,
};
