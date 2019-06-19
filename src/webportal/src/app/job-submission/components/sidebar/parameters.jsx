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

import React, {useCallback, useLayoutEffect} from 'react';
import {Stack, CommandBarButton, getTheme, CheckboxVisibility, DetailsList, DetailsListLayoutMode, IconButton, TextField} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {Hint} from './hint';
import {SidebarCard} from './sidebar-card';
import {JobParameter} from '../../models/job-parameter';

export const Parameters = React.memo(({parameters, onChange, selected, onSelect}) => {
  const onAdd = useCallback(() => {
    onChange([...parameters, {key: '', value: ''}]);
  });

  const onRemove = useCallback((idx) => {
    onChange([...parameters.slice(0, idx), ...parameters.slice(idx + 1)]);
  });

  const onKeyChange = useCallback((idx, val) => {
    const updatedParameters = [...parameters];
    updatedParameters[idx].name = val;
    onChange(updatedParameters);
  });

  const onValueChange = useCallback((idx, val) => {
    const updatedParameters = [...parameters];
    updatedParameters[idx].value = val;
    onChange(updatedParameters);
  });

  // workaround for fabric's bug
  // https://github.com/OfficeDev/office-ui-fabric-react/issues/5280#issuecomment-489619108
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  });

  const columns = [
    {
      key: 'key',
      name: 'Key',
      minWidth: 150,
      onRender: (item, idx) => (
        <TextField
          value={item.name}
          onChange={(e, val) => onKeyChange(idx, val)}
        />
      ),
    },
    {
      key: 'value',
      name: 'Value',
      minWidth: 150,
      onRender: (item, idx) => (
        <TextField
          value={item.value}
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
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
          <IconButton
            key={`remove-button-${idx}`}
            iconProps={{iconName: 'Delete'}}
            onClick={() => onRemove(idx)}
          />
        </div>
      ),
    },
  ];

  const {spacing} = getTheme();

  return (
    <SidebarCard
      title='Parameter'
      selected={selected}
      onSelect={onSelect}
    >
      <Stack gap='m'>
        <Hint>
          You could reference these parameters in command by <code>{'<% $parameters.paramKey %>'}</code>
        </Hint>
        <div>
          <DetailsList
            items={parameters}
            columns={columns}
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
    </SidebarCard>
  );
});

Parameters.propTypes = {
  parameters: PropTypes.arrayOf(PropTypes.instanceOf(JobParameter)).isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
