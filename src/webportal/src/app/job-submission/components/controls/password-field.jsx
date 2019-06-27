import React, {useCallback, useState, useRef, useLayoutEffect} from 'react';
import {TextField, StackItem, Stack, Label} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {isEmpty} from 'lodash';

import t from '../../../components/tachyons.scss';

export const PasswordField = React.memo((props) => {
  const {onChange, value, label, componentRef} = props;
  const [password, setPassword] = useState(value || '');
  const [cursorPos, setCursorPos] = useState(0);

  const hiddenChar = '●';
  const hiddenPassword = hiddenChar.repeat(password.length);

  const textFiled = useRef(null);

  useLayoutEffect(() => {
    textFiled.current.setSelectionStart(cursorPos);
    textFiled.current.setSelectionEnd(cursorPos);
  }, [cursorPos]);

  const _onPasswordChange = useCallback((_, newPassword) => {
    const passwordArr = Array.from(password);
    const diffCount = newPassword.length - password.length;
    const currentPos = textFiled.current.selectionStart;

    const secondPartStart = password.length - (newPassword.length - currentPos);
    const secondePart = passwordArr.filter((_, index) => index >= secondPartStart);
    const firstPart = passwordArr.filter((_, index) => index < secondPartStart);

    if (diffCount >= 0) {
      for (let i = 0; i < newPassword.length; i++) {
        if (newPassword[i] === hiddenChar) {
          continue;
        }
        if (i < firstPart.length) {
          firstPart[i] = newPassword[i];
        } else {
          firstPart.push(newPassword[i]);
        }
      }
    } else {
      // delete & selection + replace
      secondePart.splice(0, Math.abs(diffCount));
      for (let i = 0; i < firstPart.length; i++) {
        if (newPassword[i] === hiddenChar) {
          continue;
        }
        firstPart[i] = newPassword[i];
      }
    }
    const updatedPassword = firstPart.concat(secondePart).join('');
    setPassword(updatedPassword);
    setCursorPos(currentPos);

    if (onChange !== undefined) {
      onChange(updatedPassword);
    }
  }, [onChange, password]);

  if (!isEmpty(componentRef)) {
    componentRef.current = {
      value: password,
      textFiled: textFiled.current,
    };
  }

  const passwordFiled = (
    <TextField
      value={hiddenPassword}
      type='text'
      onChange={_onPasswordChange}
      componentRef={textFiled}
    />
  );

  if (isEmpty(label)) {
    return passwordFiled;
  }

  return (
    <Stack horizontal gap='s1'>
      <StackItem styles={{root: [t.w30]}}>
        <Label>{label}</Label>
      </StackItem>
      <StackItem grow>{passwordFiled}</StackItem>
    </Stack>
  );
});

PasswordField.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
  label: PropTypes.string,
  componentRef: PropTypes.object,
};
