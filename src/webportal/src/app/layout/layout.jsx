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

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import c from 'classnames';
import { initializeIcons } from '@uifabric/icons';
import { ColorClassNames } from '@uifabric/styling';
import { useMediaQuery } from 'react-responsive';

import Logo from './components/logo';
import Navbar from './components/navbar';
import Sidebar from './components/sidebar';
import { initTheme, boxShadow } from '../components/theme';
import { getUserRequest } from '../user/fabric/conn';

import t from '../components/tachyons.scss';

initTheme();
initializeIcons();

const BREAKPOINT = 600;

const Layout = () => {
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  // check token && get email
  useEffect(() => {
    const username = cookies.get('user');
    getUserRequest(username).then(res => {
      setUserInfo(res);
    });
  }, []);

  const isMobile = useMediaQuery({ query: `(max-width: ${BREAKPOINT}px)` });
  useEffect(() => {
    if (!isMobile && mobileShowSidebar) {
      // reset the flag when screen is large enough
      setMobileShowSidebar(false);
    }
  }, [isMobile, mobileShowSidebar]);

  return (
    <div className={c(t.vh100, t.w100, t.flex, t.flexColumn)}>
      <div className={c(t.flex)}>
        {!isMobile && <Logo style={{ minWidth: 230, height: 50 }} />}
        <div className={t.flexAuto} style={{ height: 50 }}>
          <Navbar
            onToggleSidebar={() => setMobileShowSidebar(!mobileShowSidebar)}
            userInfo={userInfo}
            mobile={isMobile}
          />
        </div>
      </div>
      <div className={c(t.flex, t.flexAuto, t.relative)}>
        <Sidebar
          className={c(t.overflowYAuto)}
          style={{
            minWidth: 230,
            height: '100%',
            display: isMobile && !mobileShowSidebar ? 'none' : undefined,
            position: isMobile ? 'absolute' : undefined,
            boxShadow: isMobile ? boxShadow : undefined,
            zIndex: 10,
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
