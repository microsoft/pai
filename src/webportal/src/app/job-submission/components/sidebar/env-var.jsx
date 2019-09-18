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

import React from 'react';
import {
  DetailsList,
  CheckboxVisibility,
  Stack,
  DetailsListLayoutMode,
  SelectionMode,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { Hint } from './hint';
import { SidebarCard } from './sidebar-card';
import { PAI_ENV_VAR } from '../../utils/constants';

const columns = [
  {
    key: 'key',
    name: 'Key',
    fieldName: 'key',
    isMultiline: true,
    minWidth: 200,
  },
  {
    key: 'desc',
    name: 'Description',
    isMultiline: true,
    fieldName: 'desc',
    minWidth: 200,
  },
];

export const EnvVar = React.memo(({ selected, onSelect }) => (
  <SidebarCard
    title='PAI environment variables'
    selected={selected}
    onSelect={onSelect}
  >
    <Stack gap='m'>
      <Hint>
        You could reference these PAI Environment Variables in command by{' '}
        <code>{'$envKey'}</code>
      </Hint>
      <div>
        <DetailsList
          items={PAI_ENV_VAR}
          columns={columns}
          checkboxVisibility={CheckboxVisibility.hidden}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          selectionMode={SelectionMode.none}
          compact
        />
      </div>
    </Stack>
  </SidebarCard>
));

EnvVar.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
