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

import c from 'classnames';
import {isNil} from 'lodash';
import PropTypes from 'prop-types';
import {Stack, ColorClassNames, FontClassNames, PersonaCoin, getTheme, FontWeights} from 'office-ui-fabric-react';
import React from 'react';

import Card from './card';

import t from '../../components/tachyons.scss';
import {DEDICATED_VC_COLOR, SHARED_VC_COLOR} from './util';

const VirtualClusterItem = ({name, info}) => {
  const availableGpu = Math.max(Math.floor(info.resourcesTotal.GPUs - info.resourcesUsed.GPUs), 0);
  const percentage = info.resourcesTotal.GPUs === 0 ? 0 : availableGpu / info.resourcesTotal.GPUs;
  const color = info.dedicated ? DEDICATED_VC_COLOR : SHARED_VC_COLOR;

  const {spacing} = getTheme();

  return (
    <Stack
      horizontal
      verticalAlign='center'
    >
      <Stack.Item>
        <PersonaCoin
          text={name}
          coinSize={48}
        />
      </Stack.Item>
      <Stack.Item grow>
        <Stack
          padding='l1'
          gap='s1'
        >
          {/* vc item text */}
          <Stack horizontal horizontalAlign='space-between'>
            {/* title */}
            <div className={c(ColorClassNames.neutralSecondary, FontClassNames.mediumPlus)}>
              {info.dedicated ? `${name} (dedicated)` : name}
            </div>
            {/* available count */}
            <Stack horizontal gap='s1'>
              <div
                className={FontClassNames.mediumPlus}
                style={{color, fontWeight: FontWeights.semibold}}
              >
                {availableGpu}
              </div>
              <div>
                GPU Available
              </div>
            </Stack>
          </Stack>
          {/* vc item gpu available bar */}
          <Stack.Item>
            <div
              className={t.flexAuto}
              style={{
                height: spacing.m,
              }}
            >
              <div className={c(t.w100, t.h100, t.flex)}>
                <div
                  style={{backgroundColor: color, width: `${percentage * 100}%`}}
                ></div>
                <div
                  className={c(ColorClassNames.neutralLightBackground)}
                  style={{width: `${(1 - percentage) * 100}%`}}
                ></div>
              </div>
            </div>
          </Stack.Item>
        </Stack>
      </Stack.Item>
    </Stack>
  );
};

VirtualClusterItem.propTypes = {
  name: PropTypes.string.isRequired,
  info: PropTypes.object.isRequired,
};

const VirtualCluster = ({style, userInfo, virtualClusters}) => {
  const vcNames = userInfo.virtualCluster.filter((name) => !isNil(virtualClusters[name]));
  const {spacing} = getTheme();
  return (
    <Card style={{paddingRight: spacing.m, ...style}}>
      <Stack styles={{root: [{height: '100%'}]}} gap='l1'>
        <Stack.Item>
          <div className={FontClassNames.mediumPlus}>
            {`My virtual clusters (${vcNames.length})`}
          </div>
        </Stack.Item>
        <Stack.Item styles={{root: [t.relative]}} grow>
          <div className={c(t.absolute, t.absoluteFill, t.overflowAuto)}>
            <Stack>
              {vcNames.sort(
                (a, b) => {
                  const wa = virtualClusters[a].dedicated ? 1 : 0;
                  const wb = virtualClusters[b].dedicated ? 1 : 0;
                  return wa - wb;
                }
              ).map((name) => (
                <Stack.Item key={name}>
                  <VirtualClusterItem
                    name={name}
                    info={virtualClusters[name]}
                  />
                </Stack.Item>
              ))}
            </Stack>
          </div>
        </Stack.Item>
      </Stack>
    </Card>
  );
};

VirtualCluster.propTypes = {
  style: PropTypes.object,
  userInfo: PropTypes.object.isRequired,
  virtualClusters: PropTypes.object.isRequired,
};

export default VirtualCluster;
