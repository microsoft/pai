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
const userRegisterComponent = require('./user-register.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../user-auth/user-auth.component');
require('./user-register.component.scss');


const userRegisterHtml = userRegisterComponent({
  breadcrumb: breadcrumbComponent,
});

$('#content-wrapper').html(userRegisterHtml);
$(document).ready(() => {
  $('#sidebar-menu--cluster-view').addClass('active');
  $('#sidebar-menu--cluster-view--user-management').addClass('active');
  $('#form-register').on('submit', (e) => {
    e.preventDefault();
    const username = $('#form-register :input[name=username]').val();
    const password = $('#form-register :input[name=password]').val();
    const virtualClusters = $('#form-register :input[name=virtualCluster]').val();
    const admin = $('#form-register :input[name=admin]').is(':checked') ? true : false;
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user`,
        data: {
          username,
          password,
          admin: admin,
          modify: false,
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
            $.ajax({
              url: `${webportalConfig.restServerUri}/api/v1/user/${username}/virtualClusters`,
              data: {
                virtualClusters: virtualClusters,
              },
              type: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              dataType: 'json',
              success: (updateVcData) => {
                $('#form-register').trigger('reset');
                if (updateVcData.error) {
                  alert(updateVcData.message);
                } else {
                  alert('Add new user successfully');
                }
              },
              error: (xhr, textStatus, error) => {
                $('#form-register').trigger('reset');
                const res = JSON.parse(xhr.responseText);
                alert(res.message);
              },
            });
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-register').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        },
      });
    });
  });

  $('#form-update-account').on('submit', (e) => {
    e.preventDefault();
    const username = $('#form-update-account :input[name=username]').val();
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
            if (admin) {
              $.ajax({
                url: `${webportalConfig.restServerUri}/api/v1/user/${username}/virtualClusters`,
                data: {
                  virtualClusters: '',
                },
                type: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                dataType: 'json',
                success: (updateVcData) => {
                  $('#form-update-account').trigger('reset');
                  if (updateVcData.error) {
                    alert(updateVcData.message);
                  } else {
                    alert('Update user basic information successfully');
                  }
                },
                error: (xhr, textStatus, error) => {
                  $('#form-update-account').trigger('reset');
                  const res = JSON.parse(xhr.responseText);
                  alert(res.message);
                },
              });
            } else {
              $('#form-update-account').trigger('reset');
              alert('Update user basic information successfully');
            }
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-update-account').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        },
      });
    });
  });

  $('#form-update-virtual-cluster').on('submit', (e) => {
    e.preventDefault();
    const username = $('#form-update-virtual-cluster :input[name=username]').val();
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
          $('#form-update-virtual-cluster').trigger('reset');
          if (data.error) {
            alert(data.message);
          } else {
            alert('Update user information successfully');
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-update-virtual-cluster').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        },
      });
    });
  });

  $('#form-remove-user').on('submit', (e) => {
    e.preventDefault();
    const username = $('#form-remove-user :input[name=username]').val();
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
  });
});
