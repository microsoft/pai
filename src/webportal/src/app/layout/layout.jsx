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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';
import 'normalize.css/normalize.css';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import c from 'classnames';
import { initializeIcons } from '@uifabric/icons';
import { initTheme } from '../components/theme';

import t from '../components/tachyons.scss';
import Logo from './components/logo';
import Navbar from './components/navbar';
import Sidebar from './components/sidebar';
import { ColorClassNames } from '@uifabric/styling';

initTheme();
initializeIcons();

const Layout = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  return (
    <div className={c(t.vh100, t.w100, t.flex, t.flexColumn)}>
      <div className={c(t.flex)}>
        <Logo style={{ minWidth: 230, height: 50 }} />
        <div className={t.flexAuto}>
          <Navbar
            className={c(t.flexAuto)}
            style={{ height: 50 }}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
          />
        </div>
      </div>
      <div className={c(t.flex, t.flexAuto)}>
        <Sidebar
          className={c(t.overflowYAuto)}
          style={{
            minWidth: 230,
            display: showSidebar ? undefined : 'none',
          }}
        />
        <div
          id='content-wrapper'
          className={c(
            t.flexAuto,
            t.overflowYAuto,
            t.overflowXAuto,
            ColorClassNames.neutralLighterBackground,
          )}
        ></div>
      </div>
    </div>
  );
};

ReactDOM.render(<Layout />, document.getElementById('wrapper'));

/*
userAuthComponent.checkToken();
if (userAuthComponent.checkAdmin()) {
  if (config.launcherType !== 'k8s') {
    $('#sidebar-menu--dashboard').show();
    $('#sidebar-menu--vc').show();
  }
  $('#sidebar-menu--cluster-view').show();
}

if (config.authnMethod !== 'OIDC') {
  $('#sidebar-menu--cluster-view--user-management').show();
}

if (Array.isArray(window.PAI_PLUGINS) && window.PAI_PLUGINS.length > 0) {
  $('.sidebar-menu').append(pluginComponent({ plugins: window.PAI_PLUGINS }));
}
*/
