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

//

require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/title-numeric.js');
const url = require('url');
//
require('./vc.component.scss');
const vcComponent = require('./vc.component.ejs');
const breadcrumbComponent = require('../job/breadcrumb/breadcrumb.component.ejs');
const vcModelComponent = require('./vc-modal-component.ejs');
const webportalConfig = require('../config/webportal.config.js');
const userAuth = require('../user/user-auth/user-auth.component');

//
let table = null;
let isAdmin = cookies.get('admin');
//

const loadData = (specifiedVc) => {
  $.ajax({
    type: 'GET',
    url: webportalConfig.restServerUri + '/api/v1/virtual-clusters',
    success: function(data) {
      const vcHtml = vcComponent({
        breadcrumb: breadcrumbComponent,
        specifiedVc: specifiedVc,
        data: data,
        formatNumber: formatNumber,
        yarnWebPortalUri: webportalConfig.yarnWebPortalUri,
        grafanaUri: webportalConfig.grafanaUri,
        isAdmin,
        modal: vcModelComponent,
      });
      $('#content-wrapper').html(vcHtml);
      table = $('#vc-table').dataTable({
        scrollY: (($(window).height() - 265)) + 'px',
        lengthMenu: [[20, 50, 100, -1], [20, 50, 100, 'All']],
        columnDefs: [
          {type: 'natural', targets: [0, 1, 2, 3, 4, 5, 6]},
        ],
      }).api();
      resizeContentWrapper();
    },
    error: function() {
      alert('Error when loading data.');
    },
  });
};

//

const formatNumber = (x, precision) => {
  const n = Math.pow(10, precision);
  return (Math.round(x * n) / n).toFixed(precision);
};

//

const resizeContentWrapper = () => {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (table != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - (isAdmin === 'true' ? 335 : 265))) + 'px');
    table.columns.adjust().draw();
  }
};

//
const virtualClusterShow = () => {
  $('#virtualClustersList input[name="vcname"]').val('');
  $('#virtualClustersList input[name="capacity"]').val('');
  $('#virtualClustersList').modal('show');
};

//
const virtualClustersAdd = () => {
  userAuth.checkToken((token) => {
    let vcName = $('#virtualClustersList input[name="vcname"]').val();
    let capacity = $('#virtualClustersList input[name="capacity"]').val();
    if (!vcName) {
      $('#virtualClustersList input[name="vcname"]').focus();
      return false;
    }
    if (!capacity) {
      $('#virtualClustersList input[name="capacity"]').focus();
      return false;
    }
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters/${vcName}`,
      data: JSON.stringify({
        'vcCapacity': capacity,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        loadData(url.parse(window.location.href, true).query['vcName']);
        $('#virtualClustersList').modal('hide');
        alert(data.message);
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};

//
const deleteVcItem = (name) => {
  if (name == 'default') return false;
  const res = confirm(`Notes:\r1. If there are jobs of this virtual cluster still running, it cannot be deleted.\r2. The capacity of this virtual cluster will be returned to default virtual cluster.\r\rAre you sure to delete ${name}?`);
  if (!res) return false;
  userAuth.checkToken((token) => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters/${name}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'DELETE',
      dataType: 'json',
      success: (data) => {
        loadData(url.parse(window.location.href, true).query['vcName']);
        alert(data.message);
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};

//
const editVcItem = (name, capacity) => {
  if (name == 'default') return false;
  $('input[name="nameEdit"]').val(name);
  $('input[name="capacityEdit"]').val(capacity);
  $('#virtualClustersEdit').modal('show');
};

//
const editVcItemPut = (name, capacity) => {
  userAuth.checkToken((token) => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters/${name}`,
      data: JSON.stringify({
        'vcCapacity': parseInt(capacity),
      }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        $('#virtualClustersEdit').modal('hide');
        loadData(url.parse(window.location.href, true).query['vcName']);
        alert(data.message);
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};


const changeVcState = (name, state) => {
  if (isAdmin !== 'true') return false;
  if (name === 'default') return false;
  userAuth.checkToken((token) => {
    const res = confirm(`Do you want to ${state.toLowerCase() == 'running' ? 'stop' : 'activate'} ${name}?`);
    if (!res) return false;
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters/${$.trim(name)}/status`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        'vcStatus': state.toLowerCase() == 'running' ? 'stopped' : 'running',
      }),
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        loadData(url.parse(window.location.href, true).query['vcName']);
        alert(data.message);
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};

const convertState = (name, state) => {
  let vcState = '';
  let vcStateChage = '';
  let vcStateOrdinary = '';
  let vcStateTips = '';
  if (state === 'RUNNING') {
    vcState = 'Running';
    vcStateChage = `onclick='changeVcState("${name}", "${state}")'`;
  } else if (state === 'STOPPED') {
    vcState = 'Stopped';
    vcStateChage = `onclick='changeVcState("${name}", "${state}")'`;
  } else {
    vcState = 'Unknown';
    vcStateChage = '';
  }
  if (isAdmin === 'true' && name !== 'default') {
    vcStateTips = 'title="Click To Change Status"';
  } else {
    vcStateOrdinary = 'state-vc-ordinary';
  }
  return `<a ${vcStateChage} class="state-vc state-${vcState.toLowerCase()} ${vcStateOrdinary}" ${vcStateTips}>${vcState}</a>`;
};

window.virtualClusterShow = virtualClusterShow;
window.deleteVcItem = deleteVcItem;
window.editVcItem = editVcItem;
window.changeVcState = changeVcState;
window.convertState = convertState;

$(document).ready(() => {
  $('#sidebar-menu--vc').addClass('active');
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  resizeContentWrapper();
  loadData(url.parse(window.location.href, true).query['vcName']);

  // add VC
  $(document).on('click', '#virtualClustersListAdd', () => {
    virtualClustersAdd();
  });

  $(document).on('click', '#virtualClustersListEdit', () => {
    let name = $('input[name="nameEdit"]').val();
    let capacity = $('input[name="capacityEdit"]').val();
    editVcItemPut(name, capacity);
  });
});
