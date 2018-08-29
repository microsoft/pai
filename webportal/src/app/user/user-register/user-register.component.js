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
const webportalConfig = require('../../config/webportal.config.js');
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
    const githubToken = $('#form-register :input[name=githubToken]').val();
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
                if (updateVcData.error) {
                  alert(updateVcData.message);
                } else {
                  $.ajax({
                    url:`${webportalConfig.restServerUri}/api/v1/user/${username}/githubToken`,
                    data:{
                      githubToken: githubToken,
                    },
                    type: 'PUT',
                    headers:{
                      Authorization: `Bearer ${token}`,
                    },
                    dataType: 'json',
                    success: (updateGithubTokenData) => {
                      $('#form-register').trigger('reset');
                      if (updateGithubTokenData.error) {
                        alert(updateGithubTokenData.message);
                      } else {
                        alert('Add new user successfully');
                      }
                    },
                    error:(xhr, textStatus, error) => {
                      $('#form-register').trigger('reset');
                      const res = JSON.parse(xhr.responseText);
                      alert(res.message);
                    },
                  })
                }
                window.location.href = '/user-view.html';
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
});
