// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import {
  IconButton,
  Stack,
  DetailsList,
  CheckboxVisibility,
  DetailsListLayoutMode,
  CommandBarButton,
  getTheme,
  SelectionMode,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { countBy, isEmpty } from 'lodash';
import React, { useCallback } from 'react';
import { DebouncedTextField } from './debounced-text-field';
// import { dispatchResizeEvent } from '../../utils/utils';

export const KeyValueList = ({
  items,
  onChange,
  secret,
  keyHeader,
  valueHeader,
}) => {
  keyHeader = keyHeader || 'Key';
  valueHeader = valueHeader || 'Value';

  const onAdd = useCallback(() => {
    onChange([...items, { key: '', value: '' }]);
  }, [onChange, items]);

  const onRemove = useCallback(
    idx => {
      onChange([...items.slice(0, idx), ...items.slice(idx + 1)]);
    },
    [onChange, items],
  );

  const onKeyChange = useCallback(
    (idx, val) => {
      onChange([
        ...items.slice(0, idx),
        { ...items[idx], key: val },
        ...items.slice(idx + 1),
      ]);
    },
    [onChange, items],
  );

  const onValueChange = useCallback(
    (idx, val) => {
      onChange([
        ...items.slice(0, idx),
        { ...items[idx], value: val },
        ...items.slice(idx + 1),
      ]);
    },
    [onChange, items],
  );

  const getKey = useCallback((item, idx) => idx, []);

  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  // useLayoutEffect(() => {
  //   dispatchResizeEvent();
  // });

  const { spacing } = getTheme();

  const columns = [
    {
      key: 'key',
      name: keyHeader,
      // minWidth: 180,
      onRender: (item, idx) => {
        return (
          <DebouncedTextField
            errorMessage={item.keyError}
            value={item.key}
            onChange={(e, val) => onKeyChange(idx, val)}
          />
        );
      },
    },
    {
      key: 'value',
      name: valueHeader,
      // minWidth: 180,
      onRender: (item, idx) => {
        return (
          <DebouncedTextField
            errorMessage={item.valueError}
            value={item.value}
            type={secret && 'password'}
            onChange={(e, val) => onValueChange(idx, val)}
          />
        );
      },
    },
    {
      key: 'remove',
      name: 'Remove',
      minWidth: 50,
      onRender: (item, idx) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <IconButton
            key={`remove-button-${idx}`}
            iconProps={{ iconName: 'Delete' }}
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
          items={items}
          columns={columns}
          getKey={getKey}
          checkboxVisibility={CheckboxVisibility.hidden}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          selectionMode={SelectionMode.none}
          compact
        />
      </div>
      <div>
        <CommandBarButton
          styles={{ root: { padding: spacing.s1 } }}
          iconProps={{ iconName: 'Add' }}
          onClick={onAdd}
        >
          Add
        </CommandBarButton>
      </div>
    </Stack>
  );
};

KeyValueList.propTypes = {
  items: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  // custom field
  secret: PropTypes.bool,
  keyHeader: PropTypes.string,
  valueHeader: PropTypes.string,
};

export const getItemsWithError = items => {
  const result = [];
  // remove old errors
  for (const item of items) {
    if (item.keyError || item.valueError) {
      result.push({ key: item.key, value: item.value });
    } else {
      result.push(item);
    }
  }
  // duplicate key
  const keyCount = countBy(result, x => x.key);
  for (const [idx, item] of result.entries()) {
    if (keyCount[item.key] > 1) {
      result[idx] = { ...item, keyError: 'Duplicated key' };
    }
  }
  // empty key
  for (const [idx, item] of result.entries()) {
    if (isEmpty(item.key) && !isEmpty(item.value) && isEmpty(item.keyError)) {
      result[idx] = { ...item, keyError: 'Empty key' };
    }
  }

  return result;
};
