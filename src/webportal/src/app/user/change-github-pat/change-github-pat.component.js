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
const changeGitHubPATComponent = require('./change-github-pat.component.ejs');
const webportalConfig = require('../../config/webportal.config.js');
const userAuth = require('../../user/user-auth/user-auth.component');
require('./change-github-pat.component.scss');


const changeGitHubPATHtml = changeGitHubPATComponent();

$('#content-wrapper').html(changeGitHubPATHtml);
$(document).ready(() => {
  const username = cookies.get('user');
  if (!username) {
    location.replace('/login.html');
  }
  userAuth.checkToken(function(token) {
    $('#form-change-github-pat').on('submit', (e) => {
      e.preventDefault();
      const githubPAT = $('#form-change-github-pat input').val();
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/user/${username}/githubPAT`,
        type: 'PUT',
        data: {
          githubPAT,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        dataType: 'json',
        success: () => {
          alert('Update GitHub Personal Access Token successfully.');
          history.back();
        },
        error: (xhr) => {
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        },
      });
    });
  });
});
