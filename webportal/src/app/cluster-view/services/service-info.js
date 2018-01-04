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
function getServiceView(kubernetesUrl, namespace) {
  var request = require('sync-request');
  var resNodes = request('GET', kubernetesUrl + '/api/v1/nodes');
  var data = JSON.parse(resNodes.body.toString('utf-8'));
  var items = data.items;
  var nodeDic = new Array();      
  var resPods = request('GET', kubernetesUrl + '/api/v1/namespaces/' + namespace + '/pods/');
  var pods = JSON.parse(resPods.body.toString('utf-8'));
  var podsItems = pods.items;
  for (var i in items) {
    var node = items[i].metadata.name
    nodeDic[node] = null;
  }

  for (var i in podsItems) {
    var pod = podsItems[i].metadata.name 
    var nodeName = podsItems[i].spec.nodeName
    var status = podsItems[i].status.phase
    console.log(nodeName)
    if(nodeDic[nodeName] == null) {
      nodeDic[nodeName] = []
    }
    nodeDic[nodeName].push({"podName": pod, "status": status})
  } 
  
  var nodesInfo = []
  for(var i in nodeDic) {
    nodesInfo.push({"nodeName": i, "podList": nodeDic[i]})
  }
  
  return nodesInfo;
}   
