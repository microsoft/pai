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
import {
  Stack,
  getTheme,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  DefaultButton,
  StackItem,
  Text,
} from 'office-ui-fabric-react';
import React from 'react';

import Card from '../../components/card';
import {UtilizationChart} from './utilization-chart';
import {zeroPaddingClass} from './util';
import {Header} from './header';

import t from '../../components/tachyons.scss';
import {ResourceBar} from './resource-bar';

const getResouceUtilization = (used, total) => {
  if (Math.abs(total) < 1e-5) {
    return 0;
  }
  return used / total;
};

const vcListColumns = [
  {
    key: 'name',
    minWidth: 100,
    name: 'Name',
    isResizable: true,
    onRender(vc) {
      return (
        <Stack verticalAlign='center' verticalFill>
          <Text variant='large'>{vc.name}</Text>
        </Stack>
      );
    },
  },
  {
    key: 'utilization',
    minWidth: 150,
    name: 'Utilization',
    isResizable: true,
    className: zeroPaddingClass,
    onRender(vc) {
      const {resourcesUsed, resourcesTotal} = vc;

      const resouceUtilization = Math.max(
        getResouceUtilization(
          resourcesUsed.GPUs,
          resourcesTotal.GPUs
        ),
        getResouceUtilization(
          resourcesUsed.memory,
          resourcesTotal.memory
        ),
        getResouceUtilization(
          resourcesUsed.vCores,
          resourcesTotal.vCores
        ),
      );
      return (
        <Stack styles={{root: [{height: 100}]}}>
          <UtilizationChart percentage={resouceUtilization}/>
        </Stack>
      );
    },
  },
  {
    key: 'detail',
    minWidth: 300,
    name: 'Detail',
    isResizable: true,
    onRender(vc) {
      const {resourcesUsed, resourcesTotal} = vc;
      return (
        <Stack gap="s1" verticalAlign='center' verticalFill>
          <StackItem>
            <ResourceBar
              name={'Memory'}
              percentage={getResouceUtilization(
                resourcesUsed.memory,
                resourcesTotal.memory
              )}
              tailInfo={`${Math.round(resourcesUsed.memory)} / ${Math.round(resourcesTotal.memory)} MB`}
            />
          </StackItem>
          <StackItem>
            <ResourceBar
              name={'CPU'}
              percentage={getResouceUtilization(
                resourcesUsed.vCores,
                resourcesTotal.vCores
              )}
              tailInfo={`${Math.round(resourcesUsed.vCores)} / ${Math.round(resourcesTotal.vCores)}`}
            />
          </StackItem>
          <StackItem>
            <ResourceBar
              name={'GPU'}
              percentage={getResouceUtilization(
                resourcesUsed.GPUs,
                resourcesTotal.GPUs
              )}
              tailInfo={`${Math.round(resourcesUsed.GPUs)} / ${Math.round(resourcesTotal.GPUs)}`}
            />
          </StackItem>
        </Stack>
      );
    },
  },
  {
    key: 'bonus',
    minWidth: 100,
    name: 'Bonus',
    isResizable: true,
    onRender(vc) {
      const bounsEnabled = (vc.maxCapacity > vc.capacity) || vc.capacity === 100;
      return (
        <Stack verticalAlign='center' verticalFill>
          <Text variant='large'>{bounsEnabled ? 'Enabled' : 'Disabled'}</Text>
        </Stack>
      );
    },
  },
  {
    key: 'action',
    minWidth: 100,
    name: 'Action',
    isResizable: true,
    onRender(vc) {
      return (
        <Stack verticalAlign='center' verticalFill>
          <DefaultButton text={'View jobs'} href={'/job-list.html?vcName=' + vc.name}/>
        </Stack>
      );
    },
  },
];

const VirtualClusterStatistics = ({style, virtualClusters}) => {
  const vcNames = Object.keys(virtualClusters);
  const {spacing} = getTheme();
  const vcList = vcNames.map((vcName) => {
    return {name: vcName, ...virtualClusters[vcName]};
  });

  return (
    <Card className={t.ph5} style={{paddingRight: spacing.m, ...style}}>
      <Stack styles={{root: [{height: '100%'}]}} gap='l1'>
        <Stack.Item>
          <Header
            headerName={`Virtual clusters (${vcNames.length})`}
            linkHref={'/virtual-clusters.html'}
            linkName={'View all'}
            showLink={true}/>
        </Stack.Item>
        <Stack.Item styles={{root: [t.relative]}} grow>
          <div
            className={c(t.absolute, t.absoluteFill, t.overflowAuto, t.pr4)}
          >
            <DetailsList
              columns={vcListColumns}
              disableSelectionZone
              items={vcList}
              layoutMode={DetailsListLayoutMode.justified}
              selectionMode={SelectionMode.none}
            />
          </div>
        </Stack.Item>
      </Stack>
    </Card>
  );
};

VirtualClusterStatistics.propTypes = {
  style: PropTypes.object,
  userInfo: PropTypes.object.isRequired,
  virtualClusters: PropTypes.object.isRequired,
};

export default VirtualClusterStatistics;
