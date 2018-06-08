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

require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/title-numeric.js');
require('./user-view.component.scss');
const url = require('url');
// const moment = require('moment/moment.js');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const userViewComponent = require('./user-view.component.ejs');
const userTableComponent = require('./user-table.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../user-auth/user-auth.component');

let table = null;

const userViewHtml = userViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  userTable: userTableComponent,
});

const removeUser = (userName) => {
  const res = confirm('Are you sure to remove the user?');
  if (res) {
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user`,
        data: {
          username,
        },
        type: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: (data) => {
          $('#form-remove-user').trigger('reset');
          if (data.error) {
            alert(data.message);
          } else {
            alert('Remove user successfully');
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-remove-user').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        },
      });
    });
  }
};


const loadUsers = (limit, specifiedVc) => {
  loading.showLoading();
  userAuth.checkToken((token) => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/user`,
      type: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: (data) => {
        if (data.error) {
          alert(data.message);
        } else {
          let displayDataSet = [];
          let rowCount = Math.min(data.length, (limit && (/^\+?[0-9][\d]*$/.test(limit))) ? limit : 2000);

          for (let i = 0; i < rowCount; i++) {
            let adminStatus =
              (data[i].admin === 'true') ? `<span class="label label-success">Admin</span>` : `<span class="label label-primary">non-admin</span>`
            let removeBtnStyle =
              (data[i].admin === 'true') ?
                '<button class="btn btn-default btn-sm" disabled>Remove</button>' :
                '<button class="btn btn-default btn-sm" onclick="removeUser(\'' +
                data[i].userName + '\')">Remove</button>';
            displayDataSet.push({
              userName: data[i].username,
              admin: adminStatus,
              vcName: data[i].virtualCluster,
              edit: `<button class="btn btn-default btn-sm">Edit</button>`,
              remove: removeBtnStyle,
            });
          }
          $('#view-table').html(userTableComponent({}));
          table = $('#user-table').dataTable({
            'data': displayDataSet,
            'columns': [
              {title: 'User', data: 'userName'},
              {title: 'Admin', data: 'admin'},
              {title: 'Virtual Cluster', data: 'vcName'},
              {title: 'Edit', data: 'edit'},
              {title: 'Remove', data: 'remove'}
            ],
            'scrollY': (($(window).height() - 265)) + 'px',
            'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
            'order': [[3, 'desc']],
            'columnDefs': [
              {type: 'natural', targets: [0, 1, 2, 3, 4]},
            ],
            'deferRender': true,
          }).api();
        }
        loading.hideLoading();
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
        loading.hideLoading();
      },
    });
  });
};


window.loadUsers = loadUsers;
window.removeUser = removeUser;

const resizeContentWrapper = () => {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (table != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
    table.columns.adjust().draw();
  }
};

$('#content-wrapper').html(userViewHtml);

$(document).ready(() => {
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  resizeContentWrapper();
  $('#sidebar-menu--cluster-view--user-management').addClass('active');
  const query = url.parse(window.location.href, true).query;
  // if (query['jobName']) {
  //   loadJobDetail(query['jobName']);
  //   $('#content-wrapper').css({'overflow': 'auto'});
  // } else {
  //   loadUsers(query['limit'], query['vcName']);
  //   $('#content-wrapper').css({'overflow': 'hidden'});
  // }
  if (query['userName']) {
    // loadJobDetail(query['userName']);
    $('#content-wrapper').css({'overflow': 'auto'});
  } else {
    loadUsers();
    $('#content-wrapper').css({'overflow': 'hidden'});
  }
});

module.exports = {loadUsers, removeUser};
