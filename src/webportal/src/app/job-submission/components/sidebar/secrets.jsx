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

import React, { useState } from 'react';
import { isEmpty } from 'lodash';
import { Stack } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { SidebarCard } from './sidebar-card';
import { Hint } from './hint';
import { KeyValueList } from '../controls/key-value-list';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';

export const Secrets = React.memo(
  ({ secrets, onChange, selected, onSelect }) => {
    const [error, setError] = useState('');
    return (
      <SidebarCard
        title='Secrets'
        tooltip={PROTOCOL_TOOLTIPS.secrets}
        selected={selected}
        onSelect={onSelect}
        error={!isEmpty(error)}
      >
        <Stack gap='m'>
          <Hint>
            Secret is a special type of parameter which will be masked after
            submission. You could reference these secrets in command by{' '}
            <code>{'<% $secrets.secretKey %>'}</code>
          </Hint>
          <div>
            <KeyValueList
              name='Secret List'
              value={secrets}
              onChange={onChange}
              onError={setError}
            />
          </div>
        </Stack>
      </SidebarCard>
    );
  },
);

Secrets.propTypes = {
  secrets: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
