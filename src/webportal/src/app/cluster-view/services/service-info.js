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

const userAuth = require('../../user/user-auth/user-auth.component');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.js');
const { clearToken } = require('../../user/user-logout/user-logout.component');

const fetchWrapper = async url => {
  const token = userAuth.checkToken();
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.ok) {
    const data = await res.json();
    return data.items;
  } else {
    loading.hideLoading();
    if (res.status === 401) {
      clearToken();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  }
};

export const getServiceView = async callback => {
  const nodeUrl = new URL(
    '/api/v1/kubernetes/nodes',
    webportalConfig.restServerUri,
  );
  const podUrl = new URL(
    '/api/v1/kubernetes/pods',
    webportalConfig.restServerUri,
  );
  podUrl.searchParams.set('namespace', 'default');
  const [nodes, pods] = await Promise.all([
    fetchWrapper(nodeUrl),
    fetchWrapper(podUrl),
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
