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

import { FontClassNames, FontWeights } from '@uifabric/styling';
import c from 'classnames';
import {
  Modal,
  TextField,
  PrimaryButton,
  MessageBar,
  MessageBarType,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, { useRef, useCallback } from 'react';

import t from 'tachyons-sass/tachyons.scss';

const LoginModal = ({ isOpen, lock, error, onDismiss, onLogin }) => {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const onSubmit = useCallback(e => {
    e.preventDefault();
    onLogin(usernameRef.current.value, passwordRef.current.value);
  }, []);
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <div className={c(t.pa5)} style={{ width: '24rem' }}>
        <div
          className={c(
            t.center,
            t.pa2,
            t.h3,
            t.w3,
            t.brPill,
            t.bgBlack,
            t.flex,
            t.justifyCenter,
            t.itemsCenter,
          )}
        >
          <img className={c(t.h2, t.w2)} src='/assets/img/favicon.ico' />
        </div>
        <div
          className={c(FontClassNames.medium, t.center, t.mt4, t.mb3, t.tc)}
          style={{ fontWeight: FontWeights.semibold }}
        >
          Sign in with your OpenPAI account
        </div>
        {error && (
          <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
        )}
        <form onSubmit={onSubmit}>
          <div className={c(t.center, t.mt3)}>
            <TextField componentRef={usernameRef} label='Username' />
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
              text='Sign in'
              type='submit'
              styles={{ root: [t.w4] }}
              disabled={lock}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
};

LoginModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  lock: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onDismiss: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
};

export default LoginModal;
