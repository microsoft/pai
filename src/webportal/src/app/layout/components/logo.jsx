// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';
import {
  ColorClassNames,
  FontClassNames,
  FontWeights,
} from '@uifabric/styling';

import t from '../../components/tachyons.scss';

const Logo = ({ className, style }) => (
  <div
    className={c(
      ColorClassNames.themePrimaryBackground,
      ColorClassNames.themeDarkAltBackgroundHover,
      className,
    )}
    style={style}
  >
    <a
      href='/home.html'
      className={c(t.flex, t.justifyCenter, t.h100, t.pa2)}
      style={{ textDecoration: 'none' }}
    >
      <div className={c(t.flex, t.itemsCenter, t.h100)}>
        <img className={t.h100} src='/favicon.ico' />
        <div
          className={c(t.ml3, FontClassNames.xLarge, ColorClassNames.white)}
          style={{ fontWeight: FontWeights.semibold }}
        >
          Platform for AI
        </div>
      </div>
    </a>
  </div>
);

Logo.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Logo;
