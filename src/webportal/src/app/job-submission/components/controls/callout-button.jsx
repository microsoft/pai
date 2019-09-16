/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Callout,
  IconButton,
  DirectionalHint,
  getTheme,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

export const CalloutButton = props => {
  const { children } = props;

  const [isCalloutVisible, setCalloutVisible] = useState(false);
  const targetRef = useRef();

  const onToggle = useCallback(() => {
    setCalloutVisible(!isCalloutVisible);
  }, [isCalloutVisible, setCalloutVisible]);

  const onDismiss = useCallback(() => {
    setCalloutVisible(false);
  }, [setCalloutVisible]);

  const { spacing } = getTheme();

  return (
    <div ref={targetRef}>
      <IconButton
        styles={{ root: { height: '100%' } }}
        iconProps={{ iconName: 'Info' }}
        onClick={onToggle}
      />
      {isCalloutVisible && (
        <Callout
          onDismiss={onDismiss}
          target={targetRef.current}
          isBeakVisible={false}
          directionalHint={DirectionalHint.topAutoEdge}
          gapSpace={8} // spacing.s1
        >
          <div style={{ padding: spacing.s1 }}>{children}</div>
        </Callout>
      )}
    </div>
  );
};

CalloutButton.propTypes = {
  children: PropTypes.node,
};
