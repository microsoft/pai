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
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/ip-address.js');
require('datatables.net-plugins/sorting/title-numeric.js');
require('jquery.ajax-cross-origin/js/jquery.ajax-cross-origin.min.js')
const url = require('url');
const hardwareComponent = require('./hardware.component.ejs');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');

const hardwareHtml = hardwareComponent({
  breadcrumb: breadcrumbComponent,
  grafanaUri: webportalConfig.grafanaUri
});

/*
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // Otherwise, CORS is not supported by the browser.
    xhr = null;
  }
  return xhr;
}
*/

const loadMachines = () => {
  /*
  var xhr = createCORSRequest('GET', 'http://10.151.40.179:9090/api/v1/node');
  if (!xhr) {
    throw new Error('CORS not supported');
  }
  xhr.onload = function() {
    var responseText = xhr.responseText;
    alert(responseText);
    console.log(responseText);
    // process the response.
  };
  xhr.onerror = function() {
    alert("ah!");
    console.log('There was an error!');
  };
  xhr.send();
  */
  /*
  $.ajax({

    // The 'type' property sets the HTTP method.
    // A value of 'PUT' or 'DELETE' will trigger a preflight request.
    type: 'GET',
  
    // The URL to make the request to.
    //url: 'http://html5rocks-cors.s3-website-us-east-1.amazonaws.com/index.html',
    url: "http://10.151.40.179:9090/api/v1/node",
  
    xhrFields: {
      // The 'xhrFields' property sets additional fields on the XMLHttpRequest.
      // This can be used to set the 'withCredentials' property.
      // Set the value to 'true' if you'd like to pass cookies to the server.
      // If this is enabled, your server must respond with the header
      // 'Access-Control-Allow-Credentials: true'.
      withCredentials: true
    },
  
    headers: {
      // Set any custom headers here.
      // If you set any non-simple headers, your server must include these
      // headers in the 'Access-Control-Allow-Headers' response header.
    },
  
    success: function(data) {
      // Here's where you handle a successful response.
      alert(data);
    },
  
    error: function() {
      // Here's where you handle an error response.
      // Note that if the error was due to a CORS issue,
      // this function will still fire, but there won't be any additional
      // information about the error.
    }
  });
  */
  $.ajax({
    url: "http://10.151.40.179:9090/api/v1/node",
    type: 'GET',
    // The name of the callback parameter, as specified by the YQL service
    jsonp: "callback",
 
    // Tell jQuery we're expecting JSONP
    dataType: "jsonp",
 
    // Tell YQL what we want and that we want JSON
    data: {
        q: "{}",
        format: "json"
    },
    success: (data) => {
      alert("yay!");
      loading.hideLoading();
      if (data.error) {
        alert(data.message);
      } else {
        $('#hardware-table').html(hardwareComponent({
          machines: data
        }));
      }
    },
    error: (xhr, textStatus, error) => {
      const res = JSON.parse(xhr.responseText);
      alert(res.message);
    }
  });
};

function resizeContentWrapper() {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
}

window.onresize = function (envent) {
  resizeContentWrapper();
}

$(document).ready(() => {
  //loadMachines();
  resizeContentWrapper();
  $("#sidebar-menu--cluster-view").addClass("active");
  $("#sidebar-menu--cluster-view--hardware").addClass("active");
  $('#content-wrapper').html(hardwareHtml);
  $('#hardware-table').DataTable({
    "scrollY": (($(window).height() - 265)) + 'px',
    "lengthMenu": [[20, 50, 100, -1], [20, 50, 100, "All"]],
    columnDefs: [
      { type: 'natural', targets: [0] },
      { type: 'ip-address', targets: [1] },
      { type: 'title-numeric', targets: [2, 3, 4, 5, 6, 7] }
    ]
  });
});
