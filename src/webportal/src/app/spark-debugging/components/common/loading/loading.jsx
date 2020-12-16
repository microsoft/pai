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

import { FontClassNames, ColorClassNames } from "@uifabric/styling";
import c from "classnames";
import { isEqual, isNil } from "lodash";
import { ProgressIndicator } from "office-ui-fabric-react/lib/ProgressIndicator";
import React from "react";
import PropTypes from "prop-types";
import Convert from "../../../models/utils/convert-utils";
import t from "tachyons-sass/tachyons.scss";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";

export const IndicatorLoading = ({ label, loadingProgress }) => {
  return (
    <div className={c(t.z9999)}>
      <div
        className={c(
          t.flex,
          t.itemsCenter,
          t.justifyCenter,
          t.mt5,
          t.mb3,
          FontClassNames.xLarge
        )}
      >
        {Convert.formatBytes(label, "display")}
      </div>
      {loadingProgress > 0 ? (
        <ProgressIndicator percentComplete={loadingProgress} barHeight={3} />
      ) : (
        <ProgressIndicator barHeight={3} />
      )}
    </div>
  );
};

IndicatorLoading.propTypes = {
  label: PropTypes.number,
  loadingProgress: PropTypes.number
};

export const DefaultSpinner  = ()=> {
  return  <div className={c(t.mt6)}><Spinner size={SpinnerSize.large} /></div>
}