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
  Text,
  Stack,
  ActionButton,
  FontSizes,
  FontWeights,
  getTheme,
  StackItem,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import Card from '../../../components/card';
import { TooltipIcon } from '../controls/tooltip-icon';

const style = {
  headerText: {
    root: {
      fontSize: FontSizes.large,
      fontWeight: FontWeights.semibold,
    },
  },
  actionButton: {
    flexContainer: {
      alignItems: 'end',
      height: 'auto',
    },
    root: {
      height: 'auto',
    },
  },
};

export const SidebarCard = ({
  title,
  selected,
  onSelect,
  children,
  error,
  tooltip,
}) => {
  const { palette } = getTheme();

  return (
    <Card
      style={{
        display: selected ? 'flex' : null,
        flexDirection: selected ? 'column' : null,
        border: error && !selected ? `1px solid ${palette.red}` : null,
      }}
    >
      <Stack gap='m' styles={{ root: { height: '100%' } }}>
        <StackItem disableShrink>
          <Stack horizontal horizontalAlign='space-between'>
            <Stack horizontal gap='s1'>
              <Text styles={style.headerText}>{title}</Text>
              {tooltip && <TooltipIcon content={tooltip} />}
            </Stack>
            <ActionButton
              iconProps={{ iconName: selected ? 'ChevronUp' : 'ChevronDown' }}
              styles={style.actionButton}
              onClick={onSelect}
            />
          </Stack>
        </StackItem>
        {selected && <div style={{ overflowY: 'auto' }}>{children}</div>}
      </Stack>
    </Card>
  );
};

SidebarCard.propTypes = {
  title: PropTypes.string,
  tooltip: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  children: PropTypes.node,
  error: PropTypes.bool,
};
