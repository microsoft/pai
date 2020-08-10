// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { PAIV2 } = require('@microsoft/openpai-js-sdk');
const userAuth = require('../../user/user-auth/user-auth.component');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.js');
const { clearToken } = require('../../user/user-logout/user-logout.component');

const wrapper = async func => {
  try {
    const data = await func();
    return data.items;
  } catch (err) {
    loading.hideLoading();
    if (err.data.code === 'UnauthorizedUserError') {
      clearToken();
    } else {
      alert(err.data.message);
    }
  }
};

export const getServiceView = async callback => {
  const restServerUrl = new URL(
    webportalConfig.restServerUri,
    window.location.href,
  );
  if (!restServerUrl.pathname.endsWith('/')) {
    restServerUrl.pathname += '/';
  }
  const client = new PAIV2.OpenPAIClient({
    token: userAuth.checkToken(),
    rest_server_uri: restServerUrl.href,
    https: window.location.protocol === 'https:',
  });
  const [nodes, pods] = await Promise.all([
    wrapper(async () => client.kubernetes.getK8sNodes()),
    wrapper(async () =>
      client.kubernetes.getK8sPods({
        namespace: 'default',
        labelSelector: 'app',
      }),
    ),
  ]);
  const resultDict = {};
  for (const node of nodes) {
    resultDict[node.metadata.name] = {
      node: node,
      podList: [],
    };
  }
  for (const pod of pods) {
    const nodeName = pod.spec.nodeName;
    if (resultDict[nodeName]) {
      resultDict[nodeName].podList.push(pod);
    }
  }
  callback(Object.values(resultDict));
};
