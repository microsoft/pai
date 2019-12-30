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

import { FontClassNames, ColorClassNames } from '@uifabric/styling';
import { Stack, StackItem, PrimaryButton } from 'office-ui-fabric-react';
import c from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { ReactComponent as SignInBackground } from '../../../assets/img/sign-in-background.svg';
import t from 'tachyons-sass/tachyons.scss';

const Jumbotron = ({ showLoginModal }) => (
  <Stack
    horizontal
    className={c(ColorClassNames.neutralLightBackground)}
    padding='l2 50px'
    gap='10%'
  >
    <Stack gap='l2' padding='100px l2 l2 150px'>
      <div className={c(FontClassNames.superLarge)}>Platform for AI</div>
      <div className={c(FontClassNames.mediumPlus, t.lhCopy)}>
        Platform for AI is an open source platform that provides complete AI
        model training and resource management capabilities, it is easy to
        extend and supports on-premise, cloud and hybrid environments in various
        scale.
      </div>
      <PrimaryButton
        styles={{ root: { maxWidth: 100 } }}
        text='Sign in'
        onClick={showLoginModal}
      />
    </Stack>
    <StackItem>
      <SignInBackground />
    </StackItem>
  </Stack>
);

Jumbotron.propTypes = {
  showLoginModal: PropTypes.func,
};

export default Jumbotron;
