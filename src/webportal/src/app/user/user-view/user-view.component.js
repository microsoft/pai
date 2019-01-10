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

const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const userViewComponent = require('./user-view.component.ejs');
const userTableComponent = require('./user-table.component.ejs');
const userEditModalComponent = require('./user-edit-modal-component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.js');
const userAuth = require('../user-auth/user-auth.component');

let table = null;

const userViewHtml = userViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  userTable: userTableComponent,
});

const removeUser = (username) => {
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
          if (data.error) {
            alert(data.message);
          } else {
            alert('Remove user successfully');
          }
          window.location.href = '/user-view.html';
        },
        error: (xhr, textStatus, error) => {
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        },
      });
    });
  }
};

const redirectToAddUser = () => {
  window.location.href = '/register.html';
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
            let removeBtnStyle =
              (data[i].admin === 'true') ?
                '<button class="btn btn-default btn-sm" title="can\'t delete admin user" disabled>Remove</button>' :
                '<button class="btn btn-default btn-sm" onclick="removeUser(\'' +
                data[i].username + '\')">Remove</button>';
            displayDataSet.push({
              userName: data[i].username,
              admin: (data[i].admin === 'true') ? 'Yes' : 'No',
              vcName: (data[i].admin === 'true') ? 'All virtual clusters' : data[i].virtualCluster,
              githubPAT: data[i].githubPAT,
              edit: '<button class="btn btn-default btn-sm" onclick="showEditInfo(\'' + data[i].username +
                    '\',\'' + data[i].admin +'\',\'' + data[i].virtualCluster + '\',\'' + data[i].hasGithubPAT + '\')">Edit</button>',
              remove: removeBtnStyle,
            });
          }
          $('#view-table').html(userTableComponent({}));
          table = $('#user-table').dataTable({
            'data': displayDataSet,
            'columns': [
              {title: 'User Name', data: 'userName'},
              {title: 'Admin', data: 'admin'},
              {title: 'Virtual Cluster List', data: 'vcName'},
              {title: 'Edit', data: 'edit'},
              {title: 'Remove', data: 'remove'},
            ],
            'scrollY': (($(window).height() - 265)) + 'px',
            'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
            'columnDefs': [
              {type: 'natural', targets: [0, 1, 2, 3, 4]},
            ],
            'deferRender': true,
            'autoWidth': false,
          }).api();
        }
        resizeContentWrapper();
        loading.hideLoading();
      },
      error: (xhr, textStatus, error) => {
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
        resizeContentWrapper();
        loading.hideLoading();
      },
    });
  });
};


const showEditInfo = (username, isAdmin, vcList, hasGithubPAT) => {
  $('#modalPlaceHolder').html(userEditModalComponent({
    'username': username,
    'isAdmin': isAdmin,
    'vcList': vcList,
    'hasGithubPAT': hasGithubPAT,
    updateUserVc,
    updateUserAccount,
    updateUserGithubPAT,
  }));
  $('#userEditModal').modal('show');
};

const updateUserVc = (username) => {
  const virtualCluster = $('#form-update-virtual-cluster :input[name=virtualCluster]').val();
  userAuth.checkToken((token) => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/user/${username}/virtualClusters`,
      data: {
        virtualClusters: virtualCluster,
      },
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      dataType: 'json',
      success: (data) => {
        if (data.error) {
          alert(data.message);
        } else {
          alert('Update user information successfully');
        }
        window.location.href = '/user-view.html';
      },
      error: (xhr, textStatus, error) => {
        $('#form-update-virtual-cluster').trigger('reset');
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};

const updateUserAccount = (username) => {
  const password = $('#form-update-account :input[name=password]').val();
  const admin = $('#form-update-account :input[name=admin]').is(':checked') ? true : false;
  userAuth.checkToken((token) => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/user`,
      data: {
        username,
        password,
        admin: admin,
        modify: true,
      },
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      dataType: 'json',
      success: (data) => {
        if (data.error) {
          alert(data.message);
        } else {
            alert('Update user basic information successfully');
            window.location.href = '/user-view.html';
        }
      },
      error: (xhr, textStatus, error) => {
        $('#form-update-account').trigger('reset');
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};

const updateUserGithubPAT = (username) => {
  const githubPAT = $('#form-update-github-token :input[name=githubPAT]').val();
  userAuth.checkToken((token) => {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/user/${username}/githubPAT`,
      data: {
        githubPAT: githubPAT,
      },
      type: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      dataType: 'json',
      success: (data) => {
        if (data.error) {
          alert(data.message);
        } else {
          alert('Update user information successfully');
        }
        window.location.href = '/user-view.html';
      },
      error: (xhr, textStatus, error) => {
        $('#form-update-github-token').trigger('reset');
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};


window.loadUsers = loadUsers;
window.removeUser = removeUser;
window.redirectToAddUser = redirectToAddUser;
window.showEditInfo = showEditInfo;
window.updateUserVc = updateUserVc;
window.updateUserAccount = updateUserAccount;
window.updateUserGithubPAT = updateUserGithubPAT;

const resizeContentWrapper = () => {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (table != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - 315)) + 'px');
    table.columns.adjust().draw();
  }
};

$('#content-wrapper').html(userViewHtml);

$(document).ready(() => {
  window.onresize = function(event) {
    resizeContentWrapper();
  };
  $('#sidebar-menu--cluster-view--user-management').addClass('active');
  loadUsers();
  $('#content-wrapper').css({'overflow': 'hidden'});
});

module.exports = {loadUsers, removeUser, showEditInfo, redirectToAddUser, updateUserVc, updateUserAccount, updateUserGithubPAT};
