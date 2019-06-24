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

import {camelCase} from 'lodash';
import {TextField, IconButton, Stack, DetailsList, CheckboxVisibility, DetailsListLayoutMode, CommandBarButton, getTheme} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, {useCallback, useLayoutEffect, useMemo, useState, useContext} from 'react';
import {dispatchResizeEvent} from '../../utils/utils';
import context from '../context';

export const KeyValueList = ({name, value, onChange, columnWidth, keyName, keyField, valueName, valueField, secret}) => {
  columnWidth = columnWidth || 200;
  keyName = keyName || 'Key';
  keyField = keyField || camelCase(keyName);
  valueName = valueName || 'Value';
  valueField = valueField || camelCase(valueName);

  const [dupList, setDupList] = useState([]);
  const {setErrorMessage} = useContext(context);

  useMemo(() => {
    const keyCount = value.reduce((res, x) => {
      if (res[x[keyField]] === undefined) {
        res[x[keyField]] = 0;
      }
      res[x[keyField]] += 1;
      return res;
    }, {});
    const newDupList = value.filter((x) => keyCount[x[keyField]] > 1).map((x) => x[keyField]);

    const msgId = `KeyValueList ${name}`;
    if (newDupList.length > 0) {
      setErrorMessage(msgId, `${name || 'KeyValueList'} has duplicated keys.`);
    } else {
      setErrorMessage(msgId, '');
    }
    setDupList(newDupList);
  }, [value]);

  const onAdd = useCallback(() => {
    onChange([...value, {[keyField]: '', [valueField]: ''}]);
  }, [onChange, value, keyField, valueField]);

  const onRemove = useCallback((idx) => {
    onChange([...value.slice(0, idx), ...value.slice(idx + 1)]);
  }, [onChange, value]);

  const onKeyChange = useCallback((idx, val) => {
    onChange([...value.slice(0, idx), {...value[idx], [keyField]: val}, ...value.slice(idx + 1)]);
  }, [onChange, value, keyField]);

  const onValueChange = useCallback((idx, val) => {
    onChange([...value.slice(0, idx), {...value[idx], [valueField]: val}, ...value.slice(idx + 1)]);
  }, [onChange, value, valueField]);

  const getKey = useCallback((item, idx) => idx, []);

  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    dispatchResizeEvent();
  }, []);

  const {spacing} = getTheme();

  const columns = [
    {
      key: keyName,
      name: keyName,
      minWidth: columnWidth,
      onRender: (item, idx) => (
        <TextField
          errorMessage={dupList.includes(item[keyField]) && 'duplicated key'}
          value={item[keyField]}
          onChange={(e, val) => onKeyChange(idx, val)}
        />
      ),
    },
    {
      key: valueName,
      name: valueName,
      minWidth: columnWidth,
      onRender: (item, idx) => (
        <TextField
          value={item[valueField]}
          type={secret && 'password'}
          onChange={(e, val) => onValueChange(idx, val)}
        />
      ),
    },
    {
      key: 'remove',
      name: 'Remove',
      minWidth: 50,
      style: {padding: 0},
      onRender: (item, idx) => (
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', height: '100%'}}>
          <IconButton
            key={`remove-button-${idx}`}
            iconProps={{iconName: 'Delete'}}
            onClick={() => onRemove(idx)}
          />
        </div>
      ),
    },
  ];

  return (
    <Stack gap='m'>
      <div>
        <DetailsList
          items={value}
          columns={columns}
          getKey={getKey}
          checkboxVisibility={CheckboxVisibility.hidden}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          compact
        />
      </div>
      <div>
        <CommandBarButton
          styles={{root: {padding: spacing.s1}}}
          iconProps={{iconName: 'Add'}}
          onClick={onAdd}
        >
          Add
        </CommandBarButton>
      </div>
    </Stack>
  );
};

KeyValueList.propTypes = {
  name: PropTypes.string,
  value: PropTypes.array,
  onChange: PropTypes.func,
  // custom field
  secret: PropTypes.bool,
  columnWidth: PropTypes.number,
  keyName: PropTypes.string,
  keyField: PropTypes.string,
  valueName: PropTypes.string,
  valueField: PropTypes.string,
};
