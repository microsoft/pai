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
const userLoginComponent = require('./user-login.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
require('./user-login.component.scss');


const userLoginHtml = userLoginComponent({
  breadcrumb: breadcrumbComponent,
});


$('#content-wrapper').html(userLoginHtml);
$(document).ready(() => {
  $('#form-login').on('submit', (e) => {
    e.preventDefault();
    const username = $('#form-login :input[name=username]').val();
    const password = $('#form-login :input[name=password]').val();
    const expiration = $('#form-login :input[name=remember]').is(':checked') ? 7 : 1;
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/token`,
      type: 'POST',
      data: {
        username,
        password,
        expiration: expiration * 24 * 60 * 60,
      },
      dataType: 'json',
      success: (data) => {
        $('#form-login').trigger('reset');
        if (data.error) {
          alert(data.message);
        } else {
          cookies.set('user', data.user, {expires: expiration});
          cookies.set('token', data.token, {expires: expiration});
          cookies.set('admin', data.admin, {expires: expiration});
          window.location.replace('/view.html');
        }
      },
      error: (xhr, textStatus, error) => {
        $('#form-login').trigger('reset');
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
});
