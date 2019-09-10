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
import c from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import t from 'tachyons-sass/tachyons.scss';

const JumbotronBackground = styled.div`
  background-image: url('/assets/img/home-background.svg');
  background-repeat: repeat;
  z-index: -2;
  position: absolute;
  width: 100%;
  height: 100%;
  &::before {
    content: '';
    display: block;
    z-index: -1;
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(0, 113, 188, 1),
      rgba(0, 113, 188, 0.65) 70%,
      rgba(0, 113, 188, 0.07)
    );
  }
`;

const Jumbotron = ({ showLoginModal }) => (
  <div className={c(t.flexAuto, t.relative, t.flex)}>
    <JumbotronBackground></JumbotronBackground>
    <div
      className={c(
        t.flexAuto,
        t.z0,
        t.pa5,
        t.relative,
        t.flex,
        t.flexColumn,
        t.itemsCenter,
        t.justifyCenter,
      )}
    >
      <div className={c(FontClassNames.superLarge, t.white)}>
        Platform for AI
      </div>
      <div
        className={c(
          FontClassNames.mediumPlus,
          t.mv5,
          t.mw7,
          t.tc,
          t.lhCopy,
          t.white,
        )}
      >
        Platform for AI is an open source platform that provides complete AI
        model training and resource management capabilities, it is easy to
        extend and supports on-premise, cloud and hybrid environments in various
        scale.
      </div>
      <div
        className={c(
          ColorClassNames.neutralLightBackgroundHover,
          t.pointer,
          t.pv2,
          t.ph4,
          t.br1,
          t.bgWhite,
          t.flex,
          t.justifyCenter,
          t.itemsCenter,
        )}
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

export default Jumbotron;
