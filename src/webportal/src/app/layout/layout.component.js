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
require('bootstrap');
require('admin-lte');
require('bootstrap/dist/css/bootstrap.min.css');
require('admin-lte/dist/css/AdminLTE.min.css');
require('admin-lte/dist/css/skins/_all-skins.min.css');
require('font-awesome/css/font-awesome.min.css');
require('./layout.component.scss');

const ReactDOM = require('react-dom');
const React = require('react');
const alerts = require('./alerts.jsx');

const userAuthComponent = require('../user/user-auth/user-auth.component.js');
const userLogoutComponent = require('../user/user-logout/user-logout.component.js');
const userLoginNavComponent = require('../user/user-login/user-login-nav.component.ejs');
const pluginComponent = require('./plugins.component.ejs');
const config = require('../config/webportal.config.js');

const userLoginNavHtml = userLoginNavComponent({ cookies });

// used by navbar's ejs
window.userLogout = userLogoutComponent.userLogout;

$('#navbar').html(userLoginNavHtml);
userAuthComponent.checkToken();
if (userAuthComponent.checkAdmin()) {
  if (config.launcherType !== 'k8s') {
    $('#sidebar-menu--dashboard').show();
    $('#sidebar-menu--vc').show();
  }
  $('#sidebar-menu--cluster-view').show();
  ReactDOM.render(
    <alerts.NotificationButton />,
    document.getElementById('notification-button'),
  );
}

if (config.authnMethod !== 'OIDC') {
  $('#sidebar-menu--cluster-view--user-management').show();
}

if (Array.isArray(window.PAI_PLUGINS) && window.PAI_PLUGINS.length > 0) {
  $('.sidebar-menu').append(pluginComponent({ plugins: window.PAI_PLUGINS }));
}
