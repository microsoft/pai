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
const k8sComponent = require('./k8s.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');

const k8sDashboardHtml = k8sComponent({
  k8sDashboardUri: webportalConfig.k8sDashboardUri,
});

function resizeContentWrapper() {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
}

window.onresize = function(envent) {
  resizeContentWrapper();
};

$(document).ready(function() {
  resizeContentWrapper();
  $('#sidebar-menu--cluster-view').addClass('active');
  $('#sidebar-menu--cluster-view--k8s').addClass('active');
  $('#content-wrapper').html(k8sDashboardHtml);
});
