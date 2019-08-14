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
  FontClassNames,
  getTheme,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  DefaultButton,
  StackItem,
} from 'office-ui-fabric-react';
import React from 'react';

import Card from '../../components/card';
import {UtilizationChart} from './utilization-chart';
import {zeroPaddingClass} from './util';

import t from '../../components/tachyons.scss';
import {ResourceBar} from './resource-bar';

const {spacing} = getTheme();

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
      return vc.name;
    },
  },
  {
    key: 'utilization',
    minWidth: 150,
    name: 'Utilization',
    isResizable: true,
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
        <Stack gap="s1">
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
      return bounsEnabled ? 'Enabled' : 'Disabled';
    },
  },
  {
    key: 'action',
    minWidth: 100,
    name: 'Action',
    isResizable: true,
    className: zeroPaddingClass,
    onRender() {
      return <DefaultButton text={'View jobs'}/>;
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
          <div className={FontClassNames.mediumPlus}>
            {`Virtual clusters (${vcNames.length})`}
          </div>
        </Stack.Item>
        <Stack.Item styles={{root: [t.relative]}} grow>
          <div className={c(t.absolute, t.absoluteFill, t.overflowAuto)}>
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
