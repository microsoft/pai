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

// This function will call kubernetes restful api to get node - podlist - label info, to support service view monitor page.

const getServiceView = (kubeURL, namespace, callback) => {
  $.ajax({
    type: 'GET',
    url: kubeURL + '/api/v1/nodes',
    dataType: 'json',
  }).then(function(data) {
    let items = data.items;
    let nodeList = [];
    for (let item of items) {
      nodeList.push(item);
    }
    getNodePods(kubeURL, namespace, nodeList, callback);
  });
};

const getNodePods = (kubeURL, namespace, nodeList, callback) => {
  $.ajax({
    type: 'GET',
    url: kubeURL + '/api/v1/namespaces/' + namespace + '/pods/',
    dataType: 'json',
  }).then(function(pods) {
    let podsItems = pods.items;
    let nodeDic = [];

    for (let pod of podsItems) {
      let nodeName = pod.spec.nodeName;
      if (nodeDic[nodeName] == null) {
        nodeDic[nodeName] = [];
      }
      nodeDic[nodeName].push(pod);
    }
    let resultDic = [];
    for (let node of nodeList) {
      if (nodeDic[node.metadata.name] == undefined) {
        nodeDic[node.metadata.name] = [];
      }
      resultDic.push({'node': node, 'podList': nodeDic[node.metadata.name]});
    }
    callback(resultDic);
  });
};

module.exports = {getServiceView};
