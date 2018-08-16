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

require('bootstrap/js/modal.js');

// const userAuth = require('../../user/user-auth/user-auth.component');
const submitComponent = require('./job-submit.component.ejs');
const taskModelComponent = require('./addmodel-task.components.ejs');
const editTaskModelComponent = require('./edit-task-modal.components.ejs');
const dockerModelComponent = require('./addmodel-docker.components.ejs');
require('./job-submit.component.scss');
// require('./edit-task-modal.components.scss');

$('#sidebar-menu--submit-v2').addClass('active');

// const submitHtml = userProfileComponent({
//   breadcrumb: submitComponent,
//   recentData: recentlyData,
//   data: myAssestData
// });

$('#content-wrapper').html(submitComponent);

$(document).on('click', '#add-task-btn', () => {
  $('#modalPlaceTask').html(taskModelComponent);
  $('#addtaskModal').modal('show');
});

$(document).on('click', '#for-edit-task', () => {
  $('#modalPlaceTask').html(editTaskModelComponent);
  $('#edit-task').modal('show');
});

$(document).on('click', '#add-docker-btn', () => {
  $('#modalPlaceDocker').html(dockerModelComponent);
  $('#addockerModal').modal('show');
});

$(document).ready(() => {
  // userAuth.checkToken(function(token) {
  // });
});
