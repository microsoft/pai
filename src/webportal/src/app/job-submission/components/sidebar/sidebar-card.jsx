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
import {Text, Stack, ActionButton, FontSizes, FontWeights, getTheme} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import Card from '../../../components/card';

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

export const SidebarCard = ({title, selected, onSelect, children, error}) => {
  const {palette} = getTheme();

  return (
    <Card style={{minHeight: selected ? 0 : null, border: error && !selected ? `1px solid ${palette.red}` : null}}>
      <Stack gap='m' styles={{root: {height: '100%'}}}>
        <Stack horizontal horizontalAlign='space-between'>
          <Text styles={style.headerText}>{title}</Text>
          <ActionButton
            iconProps={{iconName: selected ? 'ChevronUp' : 'ChevronDown'}}
            styles={style.actionButton}
            onClick={onSelect}
          />
        </Stack>
        {selected && (
          <div style={{overflowY: 'auto'}}>
            {children}
          </div>
        )}
      </Stack>
    </Card>
  );
};

SidebarCard.propTypes = {
  title: PropTypes.string,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  children: PropTypes.node,
  error: PropTypes.bool,
};
