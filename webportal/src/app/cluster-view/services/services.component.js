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
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const serviceTableComponent = require('./service-table.component.ejs');
const serviceViewComponent = require('./services.component.ejs');
const loading = require('../../job/loading/loading.component');
//const webportalConfig = require('../../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');


const serviceViewHtml = serviceViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  serviceTable: serviceTableComponent
});


const loadServices = () => {
  loading.showLoading();
  $.ajax({
    //url: `${webportalConfig.restServerUri}/api/v1/job`,
    //type: 'GET',
    success: (data) => {
      loading.hideLoading();
      if (data.error) {
        alert(data.message);
      } else {
        $('#service-table').html(serviceTableComponent({
          services: data      
        }));
      }
    },
    error: (xhr, textStatus, error) => {
      const res = JSON.parse(xhr.responseText);
      alert(res.message);
    }
  });
};


window.loadServices = loadServices;

$('#sidebar-menu--cluster-view').addClass('active');
$('#sidebar-menu--cluster-view--services').addClass('active');
$('#content-wrapper').html(serviceViewHtml);
$(document).ready(() => {
  loadServices();
});

module.exports = { loadservices }

// This function will call kubernetes restful api to get node - podlist - label info, to support service view monitor page.
function getServiceView(kubernetesUrl) {
  var nodesInfo = []
  var request = require('sync-request');
  var resNodes = request('GET', kubernetesUrl + '/api/v1/nodes');
  var data = JSON.parse(resNodes.body.toString('utf-8'));
  var items = data.items;
  for (var i in items) {
    var node = items[i].metadata.name
    var resSingleNode = request('GET', kubernetesUrl + '/api/v1/namespaces/kube-system/services/kubernetes-dashboard/proxy/api/v1/node/' + node);
    var nodeinfo = JSON.parse(resSingleNode.body.toString('utf-8'))
    var pods = nodeinfo.podList.pods
    var podList = []
    for (var i in pods) {
      podList.push({ "pod": pods[i].objectMeta.name, "status": pods[i].podStatus.status })
    }
    var labelList = []
    var labels = nodeinfo.objectMeta.labels
    for (var i in labels) {
      labelList.push({ "label": labels[i] })
    }
    var singleNodeInfo = { "node": node, "podList": podList, "labelList": labelList }
    nodesInfo.push(singleNodeInfo)
  }
  return nodesInfo;
}   
