/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
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
import {
  Text,
  Stack,
  DefaultButton,
  PrimaryButton,
} from 'office-ui-fabric-react';
import { getTheme, FontClassNames, IconFontSizes } from '@uifabric/styling';
import PropTypes from 'prop-types';

import Card from './card';
import { MarketItem } from './market-item';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

const { spacing, palette } = getTheme();

const renderItem = item => {
  return (
    <Card key={item.Id}>
      <Stack>
        <Stack horizontal horizontalAlign='space-between' gap='l2'>
          <Stack gap='l1' styles={{ root: [{ width: '80%' }] }}>
            <Stack horizontal gap='l1'>
              <div className={FontClassNames.xLarge}>{item.name}</div>
              <Stack horizontal verticalAlign='center' gap='s2'>
                <Icon iconName='Like' />
                <div>{item.stars}</div>
              </Stack>
            </Stack>
            <div>Author: mintao</div>
            <Text nowrap>{item.introduction}</Text>
            <Stack horizontal gap='s2' verticalAlign='center'>
              {item.tags.map(tag => {
                return (
                  <div
                    key={tag}
                    className={FontClassNames.small}
                    style={{
                      border: `1px solid ${palette.neutralTertiary}`,
                      color: palette.neutralTertiary,
                      padding: spacing.s1,
                    }}
                  >
                    {tag}
                  </div>
                );
              })}
            </Stack>
          </Stack>
          <Stack gap='m' styles={{ root: [{ paddingRight: spacing.l2 }] }}>
            <PrimaryButton>Submit</PrimaryButton>
            <DefaultButton href={`market-detail.html?itemId=${item.Id}`}>
              View
            </DefaultButton>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

export const ItemList = React.memo(({ items }) => {
  console.log(items);
  return <Stack>{items.map(item => renderItem(item))}</Stack>;
});

ItemList.propTypes = {
  // Filter props
  items: PropTypes.arrayOf(PropTypes.instanceOf(MarketItem)).isRequired,
};
