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

import { FontClassNames } from '@uifabric/styling';
import c from 'classnames';
import { isEmpty } from 'lodash';
import { initializeIcons } from 'office-ui-fabric-react';
import querystring from 'querystring';
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';

import Bottom from './index/bottom';
import { login } from './index/conn';
import Jumbotron from './index/jumbotron';
import LoginModal from './index/login-modal';
import { checkToken } from '../user/user-auth/user-auth.component';
import config from '../config/webportal.config';
import t from 'tachyons-sass/tachyons.scss';

let loginTarget = '/home.html';

const query = new URLSearchParams(window.location.search);
const from = query.get('from');
if (!isEmpty(from)) {
  loginTarget = from;
}

if (config.authnMethod === 'OIDC') {
  const expiration = 7;
  if (query.has('token')) {
    cookies.set('user', query.get('user'), { expires: expiration });
    cookies.set('token', query.get('token'), { expires: expiration });
    cookies.set('admin', query.get('admin'), { expires: expiration });
    cookies.set('hasGitHubPAT', query.get('hasGitHubPAT'), {
      expires: expiration,
    });
  }
}

if (checkToken(false)) {
  window.location.replace(loginTarget);
}

initializeIcons();

const Index = () => {
  const [loginModal, setLoginModal] = useState(false);
  const [error, setError] = useState(null);
  const [lock, setLock] = useState(false);
  const onLogin = useCallback((username, password) => {
    setLock(true);
    login(username, password)
      .then(() => {
        window.location.replace(loginTarget);
      })
      .catch(e => {
        setError(e.message);
      })
      .finally(() => {
        setLock(false);
      });
  }, []);

  const showLoginModal = useCallback(() => {
    if (config.authnMethod === 'basic') {
      setLoginModal(true);
    } else {
      location.href =
        config.restServerUri +
        `/api/v1/authn/oidc/login?${querystring.stringify({
          redirect_uri: new URL('/index.html', window.location.href).href,
          from: new URL(loginTarget, window.location.href).href,
        })}`;
    }
  }, []);

  const dismissLoginModal = useCallback(() => {
    setLoginModal(false);
    setError(null);
  }, []);

  return (
    <div
      className={c(
        t.minVh100,
        t.w100,
        t.flex,
        t.flexColumn,
        FontClassNames.medium,
      )}
    >
      {/* top */}
      <div className={c(t.bgBlack, t.pv3, t.ph4, t.flex, t.justifyBetween)}>
        <div className={c(FontClassNames.large, t.white)}>Platform for AI</div>
        <div
          className={c(FontClassNames.large, t.white, t.dim, t.pointer)}
          onClick={showLoginModal}
        >
          Sign in
        </div>
      </div>
      {/* content */}
      <div className={c(t.flexAuto, t.flex, t.flexColumn, t.relative)}>
        {/* jumbotron */}
        <Jumbotron showLoginModal={showLoginModal} />
        {/* bottom */}
        <Bottom />
      </div>
      {/* login modal */}
      <LoginModal
        isOpen={loginModal}
        lock={lock}
        error={error}
        onDismiss={dismissLoginModal}
        onLogin={onLogin}
      />
    </div>
  );
};

ReactDOM.render(<Index />, document.getElementById('content'));
