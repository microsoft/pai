// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { TextField } from 'office-ui-fabric-react';

import PropTypes from 'prop-types';
import { debounce } from 'lodash';

export const DebouncedTextField = props => {
  const { onChange, value } = props;
  const [cachedValue, setCachedValue] = useState('');
  useEffect(() => setCachedValue(value), [value]);
  const debouncedOnChange = useMemo(() => debounce(onChange, 200), [onChange]);

  const onChangeWrapper = useCallback(
    (e, val) => {
      setCachedValue(val);
      debouncedOnChange(e, val);
    },
    [setCachedValue, debouncedOnChange],
  );

  return (
    <TextField {...props} value={cachedValue} onChange={onChangeWrapper} />
  );
};

DebouncedTextField.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
