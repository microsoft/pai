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
import PropTypes from 'prop-types';
import {Stack, ColorClassNames, FontClassNames, PersonaCoin, FontWeights} from 'office-ui-fabric-react';
import React from 'react';

import Card from './card';
import {theme, statusColorMapping} from '../../components/theme';

import t from '../../components/tachyons.css';

const VirtualClusterItem = ({name, info, totalGpu}) => {
  const availableGpu = Math.floor(totalGpu * info.maxCapacity / 100) - info.resourcesUsed.GPUs;
  const percentage = availableGpu / totalGpu;
  let color;
  if (percentage >= 0.9) {
    color = statusColorMapping.succeeded;
  } else if (percentage >= 0.1) {
    color = statusColorMapping.waiting;
  } else {
    color = statusColorMapping.failed;
  }

  return (
    <Stack
      horizontal
      verticalAlign='center'
      gap='l1'
    >
      <Stack.Item>
        <PersonaCoin
          text={name}
          coinSize={96}
        />
      </Stack.Item>
      <Stack.Item grow>
        <Stack
          gap='l1'
        >
          <Stack.Item>
            <div className={c(ColorClassNames.neutralSecondary, FontClassNames.xLarge)} style={{fontWeight: FontWeights.regular}}>
              {name}
            </div>
          </Stack.Item>
          <Stack.Item>
            <div className={c(t.flex, t.itemsCenter, FontClassNames.xLarge)}>
              <div style={{color, width: '2rem', fontWeight: FontWeights.regular, marginRight: theme.spacing['l1']}}>
                {availableGpu}
              </div>
              <div className={ColorClassNames.neutralSecondary} style={{marginRight: theme.spacing['l2']}}>
                GPU Available
              </div>
              <div
                className={c(ColorClassNames.neutralSecondary, t.flexAuto, t.flex)}
                style={{
                  height: theme.spacing['s1'],
                  marginRight: theme.spacing['l1'],
                }}
              >
                <div style={{backgroundColor: color, width: `${(1 - percentage) * 100}%`}}>
                </div>
                <div className={ColorClassNames.neutralLightBackground} style={{width: `${percentage * 100}%`}}>
                </div>
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
  totalGpu: PropTypes.number.isRequired,
};

const VirtualCluster = ({className, userInfo, virtualClusters, totalGpu}) => {
  const vcNames = userInfo.virtualCluster.split(',');
  return (
    <Card className={className}>
      <Stack styles={{root: [t.h100]}} gap='l2'>
        <Stack.Item>
          <div className={FontClassNames.mediumPlus}>
            {`My virtual clusters (${vcNames.length})`}
          </div>
        </Stack.Item>
        <Stack.Item styles={{root: [t.relative]}} grow>
          <div className={c(t.absolute, t.absoluteFill, t.overflowAuto)}>
            <Stack gap='l3'>
              {vcNames.map((name) => (
                <Stack.Item key={name}>
                  <VirtualClusterItem
                    name={name}
                    info={virtualClusters[name]}
                    totalGpu={totalGpu}
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
  className: PropTypes.string,
  userInfo: PropTypes.object.isRequired,
  virtualClusters: PropTypes.object.isRequired,
  totalGpu: PropTypes.number.isRequired,
};

export default VirtualCluster;
