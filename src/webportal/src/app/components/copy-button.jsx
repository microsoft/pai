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

import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import { IconButton, FontSizes, TooltipHost } from 'office-ui-fabric-react';

const COPIED_TOOLTIP_CLOSE_DELAY = 1000;

const CopyButton = ({ value }) => {
  const ref = useRef(null);
  return (
    <div>
      <IconButton
        iconProps={{ iconName: 'Copy' }}
        styles={{ icon: [{ fontSize: FontSizes.small }] }}
        onClick={() => {
          copy(value);
          ref.current && ref.current.show();
          setTimeout(() => {
            ref.current && ref.current.dismiss();
          }, COPIED_TOOLTIP_CLOSE_DELAY);
        }}
      />
      <TooltipHost
        content='Copied'
        componentRef={ref}
        delay={0}
        calloutProps={{
          isBeakVisible: false,
        }}
      ></TooltipHost>
    </div>
  );
};

CopyButton.propTypes = {
  value: PropTypes.string.isRequired,
};

export default CopyButton;
