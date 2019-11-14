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

import React, { useContext } from 'react';
import {
  Text,
  Stack,
  DefaultButton,
  PrimaryButton,
  TooltipHost,
  Link,
  ColorClassNames,
  FontWeights,
  FontSizes,
} from 'office-ui-fabric-react';
import c from 'classnames';
import t from '../../components/tachyons.scss';
import { getTheme, FontClassNames } from '@uifabric/styling';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { isNil } from 'lodash';
import yaml from 'js-yaml';

import Card from './card';
import { updateMarketItem } from '../market-detail/conn';
import Context from './Context';
import Filter from './Filter';

const { spacing, palette } = getTheme();

function onSubmitClicked(item) {
  cloneJob(item.id, item.jobConfig);
  updateMarketItem(
    item.id,
    item.name,
    item.author,
    item.createDate,
    item.updateDate,
    item.category,
    item.tags,
    item.introduction,
    item.description,
    item.jobConfig,
    item.submits + 1,
    item.stars,
  );
}

function cloneJob(id, jobConfig) {
  jobConfig = yaml.safeLoad(jobConfig);
  if (isJobV2(jobConfig)) {
    window.location.href = `/submit.html?itemId=${id}#/general`;
  } else {
    window.location.href = `/submit_v1.html`;
  }
}

function isJobV2(jobConfig) {
  return (
    !isNil(jobConfig.protocol_version) || !isNil(jobConfig.protocolVersion)
  );
}

const renderItem = item => {
  return (
    <Card key={item.Id}>
      <Stack>
        <Stack horizontal horizontalAlign='space-between' gap='l2'>
          <Stack gap='l1' styles={{ root: [{ width: '80%' }] }}>
            <Stack horizontal gap='l1'>
              <TooltipHost content='marketItem'>
                <div className={FontClassNames.xLarge}>{item.name}</div>
              </TooltipHost>
              <Stack horizontal verticalAlign='center' gap='s2'>
                <TooltipHost content='submited times'>
                  <Icon iconName='Copy' />
                  <div>{item.submits}</div>
                </TooltipHost>
              </Stack>
              <Stack horizontal verticalAlign='center' gap='s2'>
                <TooltipHost content='stars'>
                  <Icon iconName='Like' />
                  <div>{item.stars}</div>
                </TooltipHost>
              </Stack>
            </Stack>
            <div>Author: {item.author}</div>
            <Text nowrap>{item.introduction}</Text>
            <Stack horizontal gap='s2' verticalAlign='center'>
              {item.tags.map(tag => {
                return (
                  <div
                    key={tag}
                    className={FontClassNames.small}
                    style={{
                      minWidth: 50,
                      maxWidth: 100,
                      border: `1px solid ${palette.neutralTertiary}`,
                      borderRadius: '5px',
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
            <PrimaryButton onClick={() => onSubmitClicked(item)}>
              Submit
            </PrimaryButton>
            <DefaultButton href={`market-detail.html?itemId=${item.id}`}>
              View
            </DefaultButton>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

export const ItemList = () => {
  const { filteredItems, setFilter, pagination } = useContext(Context);

  if (isNil(filteredItems)) {
    return <Stack> </Stack>;
  } else if (filteredItems.length === 0) {
    return (
      <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
        <div className={c(t.tc)}>
          <div>
            <Icon
              className={c(ColorClassNames.themePrimary)}
              style={{ fontSize: FontSizes.xxLarge }}
              iconName='Error'
            />
          </div>
          <div
            className={c(t.mt5, FontClassNames.xLarge)}
            style={{ fontWeight: FontWeights.semibold }}
          >
            No results matched your search.
          </div>
          <div className={c(t.mt4, FontClassNames.mediumPlus)}>
            You could search{' '}
            <Link onClick={() => setFilter(new Filter())}>
              all the marketItems
            </Link>{' '}
            or try advanced search with Filters.
          </div>
        </div>
      </div>
    );
  } else {
    const items = pagination.apply(filteredItems);
    return <Stack>{items.map(item => renderItem(item))}</Stack>;
  }
};

ItemList.contextType = Context;
