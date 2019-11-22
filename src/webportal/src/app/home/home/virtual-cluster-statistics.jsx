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
  StackItem,
  Text,
  DefaultButton,
} from 'office-ui-fabric-react';
import React, { useMemo } from 'react';

import Card from '../../components/card';
import { UtilizationChart } from './utilization-chart';
import { zeroPaddingClass } from './util';
import { Header } from './header';

import t from '../../components/tachyons.scss';
import { ResourceBar } from './resource-bar';

const getResouceUtilization = (used, total) => {
  if (Math.abs(total) < 1e-5) {
    return 0;
  }
  return used / total;
};

const vcListColumns = [
  {
    key: 'name',
    minWidth: 45,
    maxWidth: 100,
    name: 'Name',
    isResizable: true,
    onRender(vc) {
      return (
        <Stack verticalAlign='center' verticalFill>
          <Text variant='mediumPlus'>
            {vc.dedicated ? vc.name + ' (dedicated)' : vc.name}
          </Text>
        </Stack>
      );
    },
  },
  {
    key: 'utilization',
    minWidth: 80,
    maxWidth: 132,
    name: 'Utilization',
    isResizable: true,
    className: zeroPaddingClass,
    onRender(vc) {
      const { resourcesUsed, resourcesTotal } = vc;

      const resouceUtilization = Math.max(
        getResouceUtilization(resourcesUsed.GPUs, resourcesTotal.GPUs),
        getResouceUtilization(resourcesUsed.memory, resourcesTotal.memory),
        getResouceUtilization(resourcesUsed.vCores, resourcesTotal.vCores),
      );
      return (
        <Stack styles={{ root: [{ height: 98 }] }}>
          <UtilizationChart percentage={resouceUtilization} />
        </Stack>
      );
    },
  },
  {
    key: 'detail',
    minWidth: 230,
    name: 'Detail',
    isResizable: true,
    onRender(vc) {
      const { resourcesUsed, resourcesTotal } = vc;
      return (
        <Stack
          gap='s1'
          verticalAlign='center'
          verticalFill
          styles={{ root: { marginRight: 20 } }}
        >
          <StackItem>
            <ResourceBar
              name={'Memory'}
              percentage={getResouceUtilization(
                resourcesUsed.memory,
                resourcesTotal.memory,
              )}
              tailInfo={`${Math.round(resourcesUsed.memory)} / ${Math.round(
                resourcesTotal.memory,
              )} MB`}
            />
          </StackItem>
          <StackItem>
            <ResourceBar
              name={'CPU'}
              percentage={getResouceUtilization(
                resourcesUsed.vCores,
                resourcesTotal.vCores,
              )}
              tailInfo={`${Math.round(resourcesUsed.vCores)} / ${Math.round(
                resourcesTotal.vCores,
              )}`}
            />
          </StackItem>
          <StackItem>
            <ResourceBar
              name={'GPU'}
              percentage={getResouceUtilization(
                resourcesUsed.GPUs,
                resourcesTotal.GPUs,
              )}
              tailInfo={`${Math.round(resourcesUsed.GPUs)} / ${Math.round(
                resourcesTotal.GPUs,
              )}`}
            />
          </StackItem>
        </Stack>
      );
    },
  },
];

const action = {
  key: 'action',
  minWidth: 50,
  name: 'Action',
  isResizable: true,
  onRender(vc) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
        }}
        data-selection-disabled
      >
        <DefaultButton
          styles={{
            root: {
              backgroundColor: '#e5e5e5',
              minWidth: 50,
            },
            rootFocused: { backgroundColor: '#e5e5e5' },
            rootDisabled: { backgroundColor: '#eeeeee' },
            rootCheckedDisabled: { backgroundColor: '#eeeeee' },
          }}
          href={'/job-list.html?vcName=' + vc.name}
        >
          View
        </DefaultButton>
      </div>
    );
  },
};

const isAdmin = cookies.get('admin') === 'true';
if (isAdmin) {
  vcListColumns.push(action);
}

export const VirtualClusterDetailsList = props => {
  const virtualClusters = props.virtualClusters;
  const otherProps = {
    ...props,
  };
  delete otherProps.virtualClusters;
  const vcList = Object.entries(virtualClusters).map(([key, val]) => {
    return { name: key, ...val };
  });
  return (
    <DetailsList
      columns={vcListColumns}
      disableSelectionZone
      items={vcList}
      layoutMode={DetailsListLayoutMode.justified}
      selectionMode={SelectionMode.none}
      {...otherProps}
    />
  );
};

VirtualClusterDetailsList.propTypes = {
  virtualClusters: PropTypes.object,
};

export const VirtualClusterStatistics = ({
  style,
  userInfo,
  virtualClusters,
}) => {
  const { spacing } = getTheme();
  const userVC = useMemo(() => {
    if (isAdmin) {
      return virtualClusters;
    } else {
      const result = {};
      for (const [key, val] of Object.entries(virtualClusters)) {
        if (userInfo.virtualCluster && userInfo.virtualCluster.includes(key)) {
          result[key] = val;
        }
      }
      return result;
    }
  }, [userInfo, virtualClusters]);

  return (
    <Card className={t.ph5} style={{ paddingRight: spacing.m, ...style }}>
      <Stack styles={{ root: [{ height: '100%' }] }} gap='l1'>
        <Stack.Item>
          <Header
            headerName={
              isAdmin
                ? `Virtual clusters (${Object.keys(userVC).length})`
                : `My virtual clusters (${Object.keys(userVC).length})`
            }
            linkHref={'/virtual-clusters.html'}
            linkName={'View all'}
            showLink={isAdmin}
          />
        </Stack.Item>
        <Stack.Item styles={{ root: [t.relative] }} grow>
          <div className={c(t.absolute, t.absoluteFill, t.overflowAuto, t.pr4)}>
            <VirtualClusterDetailsList
              styles={{ root: { overflow: 'unset' } }}
              virtualClusters={userVC}
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
