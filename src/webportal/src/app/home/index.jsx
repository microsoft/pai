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

import {FontClassNames, ColorClassNames, FontWeights} from '@uifabric/styling';
import c from 'classnames';
import {Link, Modal, TextField, PrimaryButton, MessageBar, MessageBarType, initializeIcons} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, {useRef, useState, useCallback} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

import {checkToken} from '../user/user-auth/user-auth.component';
import config from '../config/webportal.config';

import t from '../../../node_modules/tachyons/css/tachyons.css';

const loginTarget = '/job-list.html';

if (checkToken(false)) {
  window.location.replace(loginTarget);
}

initializeIcons();

const JumbotronBackground = styled.div`
  background-image: url('/assets/img/home-background.svg');
  background-repeat: repeat;
  z-index: -2;
  position: absolute;
  width: 100%;
  height: 100%;
  &::before {
    content: "";
    display: block;
    z-index: -1;
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, rgba(0, 113, 188, 1), rgba(0, 113, 188, 0.65) 70%, rgba(0, 113, 188, 0.07)); 
  }
`;

const Jumbotron = ({showLoginModal}) => (
  <div className={c(t.flexAuto, t.relative, t.flex)}>
    <JumbotronBackground></JumbotronBackground>
    <div className={c(t.flexAuto, t.z0, t.pa5, t.relative, t.flex, t.flexColumn, t.itemsCenter, t.justifyCenter)}>
      <div className={c(FontClassNames.superLarge, t.white)}>
        Platform for AI
      </div>
      <div className={c(FontClassNames.mediumPlus, t.mv5, t.mw7, t.tc, t.lhCopy, t.white)}>
        Platform for AI is an open source platform that provides complete AI model training and resource management capabilities, it is easy to extend and supports on-premise, cloud and hybrid environments in various scale.
      </div>
      <div
        className={c(ColorClassNames.neutralLightBackgroundHover, t.pointer, t.pv2, t.ph4, t.br1, t.bgWhite, t.flex, t.justifyCenter, t.itemsCenter)}
        onClick={showLoginModal}
      >
        <div className={c(ColorClassNames.themePrimary, FontClassNames.medium)}>
          Sign in
        </div>
      </div>
    </div>
  </div>
);

Jumbotron.propTypes = {
  showLoginModal: PropTypes.func,
};

const Bottom = () => (
  <div className={c(t.bgWhite, t.pt5, t.pb6, t.ph6, t.flex, t.flexWrap)}>
    <div className={c(t.w33, t.w100M, t.tc, t.flex, t.flexColumn, t.itemsCenter, t.justifyBetween)}>
      <div className={c(t.flex, t.flexColumn, t.itemsCenter)}>
        <div className={c(FontClassNames.xxLarge)} style={{fontWeight: FontWeights.semibold}}>
          Submit a hello-world job
        </div>
        <div className={c(FontClassNames.mediumPlus, t.lhCopy, t.mv4)} style={{maxWidth: '20rem'}}>
          With submitting a hello-world job, this section introduces more knowledge about job, so that you can write your own job configuration easily.
        </div>
      </div>
      <Link
        href='https://github.com/Microsoft/pai/blob/master/docs/user/training.md'
        target='_blank'
        style={{fontWeight: FontWeights.semibold}}
      >
        Learn more
      </Link>
    </div>
    <div className={c(t.w34, t.w100M, t.mt5M, t.tc, t.ph4, t.flex, t.flexColumn, t.itemsCenter, t.justifyBetween)}>
      <div className={c(t.flex, t.flexColumn, t.itemsCenter)}>
        <div className={c(FontClassNames.xxLarge)} style={{fontWeight: FontWeights.semibold}}>
          Understand Job
        </div>
        <div className={c(FontClassNames.mediumPlus, t.lhCopy, t.mv4)} style={{maxWidth: '20rem'}}>
          The job of OpenPAI defines how to execute command(s) in specified environment(s). A job can be model training, other kinds of commands, or distributed on multiple servers.
        </div>
      </div>
      <Link
        href='https://github.com/Microsoft/pai/blob/master/docs/user/training.md#understand-job'
        target='_blank'
        style={{fontWeight: FontWeights.semibold}}
      >
        Learn more
      </Link>
    </div>
    <div className={c(t.w33, t.w100M, t.mt5M, t.tc, t.flex, t.flexColumn, t.itemsCenter, t.justifyBetween)}>
      <div className={c(t.flex, t.flexColumn, t.itemsCenter)}>
        <div className={c(FontClassNames.xxLarge)} style={{fontWeight: FontWeights.semibold}}>
          Use VS Code Extension to work with Jobs
        </div>
        <div className={c(FontClassNames.mediumPlus, t.lhCopy, t.mv4)} style={{maxWidth: '20rem'}}>
          OpenPAI Client is a VS Code extension to connect PAI clusters, submit AI jobs, and manage files on HDFS, etc. You need to install the extension in VS code before using it.
        </div>
      </div>
      <Link
        href='https://github.com/Microsoft/pai/blob/master/contrib/pai_vscode/VSCodeExt.md'
        target='_blank'
        style={{fontWeight: FontWeights.semibold}}
      >
        Learn more
      </Link>
    </div>
  </div>
);

async function login(username, password, expiration = 7 * 24 * 60 * 60) {
  const res = await fetch(`${config.restServerUri}/api/v1/token`, {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      expiration,
    }),
    headers: {
      'content-type': 'application/json',
    },
  });
  if (res.ok) {
    const data = await res.json();
    if (data.error) {
      throw new Error(data.message);
    } else {
      cookies.set('user', data.user, {expires: expiration});
      cookies.set('token', data.token, {expires: expiration});
      cookies.set('admin', data.admin, {expires: expiration});
      cookies.set('hasGitHubPAT', data.hasGitHubPAT, {expires: expiration});
    }
  } else {
    const data = await res.json();
    throw new Error(data.message);
  }
}

const Home = () => {
  const [loginModal, setLoginModal] = useState(false);
  const [error, setError] = useState(null);
  const [lock, setLock] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const onLogin = useCallback(
    (e) => {
      e.preventDefault();
      setLock(true);
      void login(
        usernameRef.current.value,
        passwordRef.current.value
      ).then(() => {
        window.location.replace(loginTarget);
      }).catch((e) => {
        setError(e.message);
      }).finally(() => {
        setLock(false);
      });
    },
    [],
  );

  const showLoginModal = useCallback(
    () => setLoginModal(true),
    [],
  );

  const dismissLoginModal = useCallback(
    () => {
      setLoginModal(false);
      setError(null);
    },
    [],
  );

  return (
    <div className={c(t.minVh100, t.w100, t.flex, t.flexColumn)}>
      {/* top */}
      <div className={c(t.bgBlack, t.pv3, t.ph4, t.flex, t.justifyBetween)}>
        <div className={c(FontClassNames.large, t.white)}>
          Platform for AI
        </div>
        <div className={c(FontClassNames.large, t.white, t.dim, t.pointer)} onClick={showLoginModal}>
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
      <Modal
        isOpen={loginModal}
        onDismiss={dismissLoginModal}
      >
        <div className={c(t.pa5)} style={{width: '24rem'}}>
          <div className={c(t.center, t.pa2, t.h3, t.w3, t.brPill, t.bgBlack, t.flex, t.justifyCenter, t.itemsCenter)}>
            <img className={c(t.h2, t.w2)} src='/assets/img/favicon.ico' />
          </div>
          <div className={c(FontClassNames.medium, t.center, t.mt4, t.mb3, t.tc)} style={{fontWeight: FontWeights.semibold}}>
            Sign in with your OpenPAI account
          </div>
          {error && (
            <MessageBar messageBarType={MessageBarType.error}>
              {error}
            </MessageBar>
          )}
          <form onSubmit={onLogin}>
            <div className={c(t.center, t.mt3)}>
              <TextField componentRef={usernameRef} label='Username'/>
            </div>
            <div className={c(t.center, t.mt3)}>
              <TextField
                componentRef={passwordRef}
                label='Password'
                type='password'
              />
            </div>
            <div className={c(t.center, t.mt4, t.tc)}>
              <PrimaryButton
                text="Sign in"
                type="submit"
                styles={{root: [t.w4]}}
                disabled={lock}
              />
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

ReactDOM.render(<Home />, document.getElementById('content'));
