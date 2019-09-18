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
import { isEqual, isNil } from 'lodash';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import React, { useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';

import t from './tachyons.scss';

import loadingGif from '../../assets/img/loading.gif';

export const Loading = () => (
  <div
    className={c(
      t.fixed,
      t.absoluteFill,
      ColorClassNames.whiteTranslucent40Background,
      t.z9999,
    )}
  >
    <div className={c(t.flex, t.itemsCenter, t.justifyCenter, t.h100)}>
      <img className={t.o50} src={loadingGif} />
    </div>
  </div>
);

// min-height issue hack
// https://stackoverflow.com/questions/8468066/child-inside-parent-with-min-height-100-not-inheriting-height
export const SpinnerLoading = ({ label = 'Loading...' }) => {
  const [style, setStyle] = useState({});
  useLayoutEffect(() => {
    function layout() {
      const contentWrapper = document.getElementById('content-wrapper');
      if (isNil(contentWrapper)) {
        return;
      }
      const pt = window.getComputedStyle(contentWrapper).paddingTop;
      const rect = contentWrapper.getBoundingClientRect();
      const nextStyle = {
        paddingTop: pt,
        top: rect.top,
        left: rect.left,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
      };
      if (!isEqual(nextStyle, style)) {
        setStyle(nextStyle);
      }
    }
    layout();
    window.addEventListener('resize', layout);
    return () => {
      window.removeEventListener('resize', layout);
    };
  });

  return (
    <div
      className={c(t.flex, t.itemsCenter, t.justifyCenter, t.fixed)}
      style={style}
    >
      <div className={c(t.flex, t.itemsCenter)}>
        <Spinner size={SpinnerSize.large} />
        <div className={c(t.ml4, FontClassNames.xLarge)}>{label}</div>
      </div>
    </div>
  );
};

SpinnerLoading.propTypes = {
  label: PropTypes.string,
};

export const MaskSpinnerLoading = ({ label = 'Loading...' }) => (
  <div
    className={c(
      t.fixed,
      t.absoluteFill,
      ColorClassNames.whiteTranslucent40Background,
      t.z9999,
    )}
  >
    <div className={c(t.flex, t.itemsCenter, t.justifyCenter, t.h100)}>
      <div className={c(t.flex, t.itemsCenter)}>
        <Spinner size={SpinnerSize.large} />
        <div className={c(t.ml4, FontClassNames.xLarge)}>{label}</div>
      </div>
    </div>
  </div>
);

MaskSpinnerLoading.propTypes = {
  label: PropTypes.string,
};
