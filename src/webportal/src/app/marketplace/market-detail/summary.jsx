// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { FontClassNames, getTheme } from '@uifabric/styling';
import c from 'classnames';
import { DefaultButton, PrimaryButton, Stack } from 'office-ui-fabric-react';
import React, { useState, useContext } from 'react';
import t from '../../components/tachyons.scss';
import Card from './card';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';

import EditMarketItem from './EditMarketItem';
import DeleteMarketItem from './DeleteMarketItem';
import Context from './Context';
import { updateMarketItem } from './conn';
import yaml from 'js-yaml';
import { isNil } from 'lodash';

const { spacing } = getTheme();

const user = cookies.get('user');

export default function Summary() {
  const { marketItem } = useContext(Context);

  const [hideDialog, setHideDialog] = useState(true);
  const [hideDeleteDialog, setHideDeleteDialog] = useState(true);
  const [stars, setStars] = useState(marketItem.stars);
  const [starClicked, setStarClicked] = useState(false);
  const [submits, setSubmits] = useState(marketItem.submits);

  // save jobConfig to localStorage
  window.localStorage.setItem('jobConfig', marketItem.jobConfig);

  function showDialog(event) {
    event.stopPropagation();
    setHideDialog(false);
  }

  function showDeleteDialog(event) {
    event.stopPropagation();
    setHideDeleteDialog(false);
  }

  function onLikeCliked(event) {
    if (starClicked) {
      setStars(stars - 1);
      setStarClicked(false);
    } else {
      setStars(stars + 1);
      setStarClicked(true);
    }
  }

  function onSubmitClicked() {
    cloneJob(marketItem.jobConfig);
    setSubmits(submits + 1);
    updateMarketItem(
      marketItem.id,
      marketItem.name,
      marketItem.author,
      marketItem.createDate,
      marketItem.updateDate,
      marketItem.category,
      marketItem.tags,
      marketItem.introduction,
      marketItem.description,
      marketItem.jobConfig,
      marketItem.submits + 1,
      marketItem.stars,
    );
  }

  function cloneJob(jobConfig) {
    jobConfig = yaml.safeLoad(jobConfig);
    if (isJobV2(jobConfig)) {
      window.location.href = `/submit.html?marketItemId=${marketItem.id}#/general`;
    } else {
      window.location.href = `/submit_v1.html`;
    }
  }

  function isJobV2(jobConfig) {
    return (
      !isNil(jobConfig.protocol_version) || !isNil(jobConfig.protocolVersion)
    );
  }

  return (
    <div
      style={{
        marginTop: spacing.m,
      }}
    >
      {/* summary */}
      <Card className={c(t.pv4, t.ph5)}>
        <Stack gap={'l1'}>
          {/* summary-row-1 */}
          <div className={FontClassNames.xLarge}>{marketItem.name}</div>
          {/* summary-row-2 */}
          <Stack horizontal gap={'m'}>
            <TooltipHost content='Author'>
              <Stack horizontal gap='s1'>
                <Icon iconName='Contact' />
                <span className={c(t.gray, FontClassNames.medium)}>
                  {marketItem.author}
                </span>
              </Stack>
            </TooltipHost>
            <Stack className={c(t.gray, FontClassNames.medium)}>
              <TooltipHost content='submited times'>
                <Stack horizontal gap={'s1'}>
                  <Icon iconName='Copy' />
                  <span>{marketItem.submits}</span>
                </Stack>
              </TooltipHost>
            </Stack>
            <Stack className={c(t.gray, FontClassNames.medium)}>
              <TooltipHost content='stars'>
                <Stack horizontal gap={'s'}>
                  <button
                    onClick={onLikeCliked}
                    style={{ backgroundColor: 'Transparent', border: 'none' }}
                  >
                    <Icon iconName='Like' />
                  </button>
                  <span>{stars}</span>
                </Stack>
              </TooltipHost>
            </Stack>
          </Stack>
          {/* summary-row-3 */}
          <div className={c(t.gray)}>{marketItem.introduction}</div>
          {/* summary-row-4 */}
          <Stack horizontal gap='m'>
            <PrimaryButton text='Submit' onClick={onSubmitClicked} />
            <DefaultButton text='Edit' onClick={showDialog} />
            <EditMarketItem
              hideDialog={hideDialog}
              setHideDialog={setHideDialog}
            />
            <DefaultButton text='Delete' onClick={showDeleteDialog} />
            <DeleteMarketItem
              hideDeleteDialog={hideDeleteDialog}
              setHideDeleteDialog={setHideDeleteDialog}
            />
          </Stack>
        </Stack>
      </Card>
    </div>
  );
}

Summary.contexttype = Context;
