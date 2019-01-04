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
        admin: cookies.get('admin'),
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
      $(".state-vc .tips").html("Click Change Status");
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
    $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
    table.columns.adjust().draw();
  }
};

// 格式数据
const virtualClusterShow = () => {
  $("#virtualClustersList input[name='vcname']").val('');
  $("#virtualClustersList input[name='ecapacity']").val('');
  $("#virtualClustersList").modal('show');
}

// 新增 vc
const virtualClustersAdd = () => {
  userAuth.checkToken((token) => {
    let vcName = $("#virtualClustersList input[name='vcname']").val();
    let ecapacity = $("#virtualClustersList input[name='ecapacity']").val();
    if (!vcName) {
      $("#virtualClustersList input[name='vcname']").focus();
      return false;
    }
    if (!ecapacity) {
      $("#virtualClustersList input[name='ecapacity']").focus();
      return false;
    }
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters/${vcName}`,
      data: JSON.stringify({
        "vcCapacity": ecapacity
      }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        loadData(url.parse(window.location.href, true).query['vcName']);
        $("#virtualClustersList").modal('hide');
        alert(data.message);
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  })
}

// 删除vc一项
const deleteVcItem = (name) => {
  if (name == "default") return false;
  const res = confirm(`Are you sure to delete ${name}?`);
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
  })
}

// 修改vc一项
const editVcItem = (name, capacity) => {
  if (name == 'default') return false;
  $("input[name='nameEdit']").val(name);
  $("input[name='ecapacityEdit']").val(capacity);
  $("#virtualClustersEdit").modal("show");
}

// 修改
const editVcItemPut = (name, capacity) => {
  userAuth.checkToken((token) => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters/${name}`,
      data: JSON.stringify({
        "vcCapacity": parseInt(capacity)
      }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        $("#virtualClustersEdit").modal("hide");
        loadData(url.parse(window.location.href, true).query['vcName']);
        alert(data.message);
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  })
}

//更改状态
const changeVcSate = (name, state) => {
  userAuth.checkToken((token) => {
    if (name == 'default') return false;
    const res = confirm(`Are you ${state == 'running' ? 'stop' : 'active'} vc ${name}?`);
    if (!res) return false;
    if (!cookies.get('admin')) return false;
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/virtual-clusters/${$.trim(name)}/status`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        "vcStatus": state.toLowerCase() == "running" ? "stopped" : "running"
      }),
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        loadData(url.parse(window.location.href, true).query['vcName']);
        alert(data.message)
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    })
  })
}

window.virtualClusterShow = virtualClusterShow;
window.deleteVcItem = deleteVcItem;
window.editVcItem = editVcItem;
window.changeVcSate = changeVcSate;

$(document).ready(() => {
  $('#sidebar-menu--vc').addClass('active');
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  resizeContentWrapper();
  loadData(url.parse(window.location.href, true).query['vcName']);

  // 添加VC
  $(document).on('click', '#virtualClustersListAdd', () => {
    virtualClustersAdd();
  })

  $(document).on("click", "#virtualClustersListEdit", () => {
    let name  = $("input[name='nameEdit']").val();
    let capacity  = $("input[name='ecapacityEdit']").val();
    editVcItemPut(name, capacity);
  })

});
