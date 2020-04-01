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
  FontClassNames,
  Link,
} from 'office-ui-fabric-react';
import React, { useMemo } from 'react';

import Card from '../../components/card';
import { UtilizationChart } from './utilization-chart';
import { zeroPaddingClass } from './util';
import { Header } from './header';
import config from '../../config/webportal.config';

import t from '../../components/tachyons.scss';
import { ResourceBar } from './resource-bar';

const getResouceUtilization = (used, guaranteed) => {
  if (Math.abs(guaranteed) < 1e-5) {
    return 0;
  }
  return used / guaranteed;
};

const isAdmin = cookies.get('admin') === 'true';
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
          {isAdmin ? (
            <Link
              href={'/job-list.html?vcName=' + vc.name}
              className={FontClassNames.mediumPlus}
            >
              {vc.dedicated ? vc.name + ' (dedicated)' : vc.name}
            </Link>
          ) : (
            <div className={FontClassNames.mediumPlus}>
              {vc.dedicated ? vc.name + ' (dedicated)' : vc.name}
            </div>
          )}
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
      const resourcesGuaranteed = vc.resourcesGuaranteed || resourcesTotal;

      const resouceUtilization = Math.max(
        getResouceUtilization(resourcesUsed.GPUs, resourcesGuaranteed.GPUs),
        getResouceUtilization(resourcesUsed.memory, resourcesGuaranteed.memory),
        getResouceUtilization(resourcesUsed.vCores, resourcesGuaranteed.vCores),
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
    minWidth: 200,
    name: 'Detail: Used / (Total - Bad)',
    isResizable: true,
    onRender(vc) {
      const { resourcesUsed, resourcesTotal } = vc;
      const resourcesGuaranteed = vc.resourcesGuaranteed || resourcesTotal;
      return (
        <Stack
          gap='s1'
          verticalAlign='center'
          verticalFill
          styles={{ root: { marginRight: 20 } }}
        >
          <StackItem>
            <ResourceBar
              name={'MEM GB'}
              percentage={getResouceUtilization(
                resourcesUsed.memory,
                resourcesGuaranteed.memory,
              )}
              tailInfo={`${Math.round(resourcesUsed.memory / 1024)} /
                (${Math.round(resourcesTotal.memory / 1024)} - ${Math.round(
                (resourcesTotal.memory - resourcesGuaranteed.memory) / 1024,
              )})
              `}
            />
          </StackItem>
          <StackItem>
            <ResourceBar
              name={'CPU'}
              percentage={getResouceUtilization(
                resourcesUsed.vCores,
                resourcesGuaranteed.vCores,
              )}
              tailInfo={`${Math.round(resourcesUsed.vCores)} /
                (${Math.round(resourcesTotal.vCores)} - ${Math.round(
                resourcesTotal.vCores - resourcesGuaranteed.vCores,
              )})
              `}
            />
          </StackItem>
          <StackItem>
            <ResourceBar
              name={'GPU'}
              percentage={getResouceUtilization(
                resourcesUsed.GPUs,
                resourcesGuaranteed.GPUs,
              )}
              tailInfo={`${Math.round(resourcesUsed.GPUs)} /
                (${Math.round(resourcesTotal.GPUs)} - ${Math.round(
                resourcesTotal.GPUs - resourcesGuaranteed.GPUs,
              )})
              `}
            />
          </StackItem>
        </Stack>
      );
    },
  },
];

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
            showLink={isAdmin && config.launcherType !== 'k8s'}
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
