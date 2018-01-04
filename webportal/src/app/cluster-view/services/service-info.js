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
        type: "GET",
        url: kubeURL + "/api/v1/nodes",
        dataType: "json",
        success: function (data) {
            var items = data.items;
            var nodeList = []
            for (var i in items) {
                var node = items[i].metadata.name
                nodeList.push(node);
            }
            getNodePods(kubeURL, namespace, nodeList, callback)
        }
    });
}

const getNodePods = (kubeURL, namespace, nodeList, callback) => {
    $.ajax({
        type: "GET",
        url: kubeURL + "/api/v1/namespaces/" + namespace + "/pods/",
        dataType: "json",
        success: function (pods) {
            var podsItems = pods.items;
            var nodeDic = new Array();

            for (var i in podsItems) {
                var pod = podsItems[i].metadata.name
                var nodeName = podsItems[i].spec.nodeName
                var status = podsItems[i].status.phase
                if (nodeDic[nodeName] == null) {
                    nodeDic[nodeName] = []
                }
                nodeDic[nodeName].push({ "podName": pod, "status": status })
            }
            var resultDic = []
            for(var i in nodeList) {
                resultDic.push({"nodeName": nodeList[i], "podList": nodeDic[nodeList[i]]})
            }
            callback(resultDic)
        }
    });
}
