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
const changePasswordComponent = require('./change-password.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
require('./change-password.component.scss');


const changePasswordHtml = changePasswordComponent({
  breadcrumb: breadcrumbComponent,
});

$('#content-wrapper').html(changePasswordHtml);
$(document).ready(() => {
  $('#form-change-password').on('submit', (e) => {
    e.preventDefault();
    const oldPassword = $('#form-change-password :input[name=old-password]').val();
    const newPassword = $('#form-change-password :input[name=new-password]').val();
    const newPasswordConfirm = $('#form-change-password :input[name=new-password-confirm]').val();
    const username = cookies.get('user');
    const admin = cookies.get('admin');
    if (newPassword !== newPasswordConfirm) {
      $('#form-change-password').trigger('reset');
      alert('Please enter the same new password!');
    } else if (newPassword === oldPassword) {
      $('#form-change-password').trigger('reset');
      alert('Please enter a password different from the old one!');
    } else {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/token`,
        type: 'POST',
        data: {
          username,
          password: oldPassword,
          expiration: 60 * 60,
        },
        dataType: 'json',
        success: (tokenData) => {
          if (tokenData.error) {
            $('#form-change-password').trigger('reset');
            alert('Wrong old password!\n' + tokenData.message);
          } else {
            $.ajax({
              url: `${webportalConfig.restServerUri}/api/v1/user`,
              data: {
                username,
                password: newPassword,
                admin,
                modify: true,
              },
              type: 'PUT',
              headers: {
                Authorization: `Bearer ${tokenData.token}`,
              },
              dataType: 'json',
              success: (userData) => {
                $('#form-change-password').trigger('reset');
                if (userData.error) {
                  alert(userData.message);
                } else {
                  alert('Change password successfully, please login again.');
                  userLogout();
                }
              },
              error: (xhr, textStatus, error) => {
                $('#form-change-password').trigger('reset');
                const res = JSON.parse(xhr.responseText);
                alert(res.message);
              },
            });
          }
        },
        error: (xhr, textStatus, error) => {
          $('#form-change-password').trigger('reset');
          const res = JSON.parse(xhr.responseText);
          alert('Wrong old password!\n' + res.message);
        },
      });
    }
  });
});
