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

import React, { useRef, useState, useEffect } from 'react';
import { PropTypes } from 'prop-types';

import {
  TextField,
  Callout,
  DirectionalHint,
  DefaultButton,
  getTheme,
} from 'office-ui-fabric-react';

function CustomPassword(props) {
  const { onChange, onFocus, onBlur, componentRef, ...otherProps } = props;

  useEffect(() => {
    if (componentRef && passwordInputRef) {
      componentRef.current = passwordInputRef.current;
    }
    return () => {
      if (componentRef) {
        componentRef.current = null;
      }
    };
  });

  const passwordInputRef = useRef(null);
  const randomPasswordTargetRef = useRef(null);
  const randomPasswordButtonRef = useRef(null);

  const [showRandomPassword, setShowRandomPassword] = useState(false);
  const handleOnFocusPassword = event => {
    if (!passwordInputRef.current.value) {
      setShowRandomPassword(true);
    }

    if (onFocus) {
      onChange(event);
    }
  };
  const handleOnLostFocusPassword = event => {
    if (
      !event.relatedTarget ||
      !randomPasswordButtonRef.current ||
      event.relatedTarget.id !== randomPasswordButtonRef.current.props.id
    ) {
      setShowRandomPassword(false);
    }

    if (onBlur) {
      onChange(event);
    }
  };
  const handleOnChangePassword = (event, newValue) => {
    if (event.target.value) {
      setShowRandomPassword(false);
    } else {
      setShowRandomPassword(true);
    }
    setPassword(newValue);

    if (onChange) {
      onChange(event, newValue);
    }
  };

  const generateRandomPassword = () => {
    return Array(8)
      .fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
      .map(x => x[Math.floor(Math.random() * x.length)])
      .join('');
  };

  let randomPassword = '';
  if (showRandomPassword) {
    randomPassword = generateRandomPassword();
  }

  const [password, setPassword] = useState('');
  useEffect(() => {
    setPassword(props.defaultValue);
  }, [props.defaultValue]);
  const handleSetRandomPassword = () => {
    setPassword(randomPassword);
    if (onChange) {
      onChange(null, randomPassword);
    }
    setShowRandomPassword(false);
  };

  const { spacing } = getTheme();

  return (
    <React.Fragment>
      <TextField
        id={`PasswordInput${Math.random()}`}
        componentRef={passwordInputRef}
        {...otherProps}
        value={password}
        onFocus={handleOnFocusPassword}
        onBlur={handleOnLostFocusPassword}
        onChange={handleOnChangePassword}
      />
      <div ref={randomPasswordTargetRef}>
        {showRandomPassword && (
          <Callout
            target={randomPasswordTargetRef.current}
            directionalHint={DirectionalHint.bottomLeftEdge}
            isBeakVisible={false}
            gapSpace={0}
            calloutWidth={
              randomPasswordTargetRef.current
                ? Math.max(randomPasswordTargetRef.current.clientWidth, 220)
                : 0
            }
          >
            <DefaultButton
              id='btnSetRandomPassword'
              text={`Random initial password    ${randomPassword}`}
              onClick={handleSetRandomPassword}
              componentRef={randomPasswordButtonRef}
              styles={{
                root: {
                  width: '100%',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  paddingLeft: spacing.s1,
                  paddingRight: spacing.s1,
                },
                label: {
                  fontWeight: 'normal',
                  fontSize: 'smaller',
                  whiteSpace: 'pre',
                },
              }}
            />
          </Callout>
        )}
      </div>
    </React.Fragment>
  );
}

CustomPassword.propTypes = {
  placeholder: PropTypes.string,
  componentRef: PropTypes.object,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

export default CustomPassword;
