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
import {Stack, StackItem, FontClassNames, ColorClassNames, DetailsList, DetailsHeader, DetailsRow, SelectionMode, Toggle, Link, getTheme} from 'office-ui-fabric-react';
import React, {useState} from 'react';
import t from '../../components/tachyons.scss';
import {checkUserPermission, checkPermission} from './util';
import {ScrollXYBarStyles} from '../components/scrollbar-styles';
import {TokenUsage} from '../components/token-usage';
import {applyDrawingData} from './getJobStatus';

const username = cookies.get('user');
const {spacing} = getTheme();

function selectOneCluster(subCluster, vc) {
  cookies.set('subClusterUri', subCluster, {expires: 7});
  cookies.set('virtualClusterUri', [vc], {expires: 7});
}

  const MyClustersList = ({subClusters, aggregatedVirtualClusters, virtualCluster, userGroupList, navigatedBySubCluster}) => {
    const [descending, setDescending] = useState(false);
    const [isSorted, setIsSorted] = useState(false);

    function onColumnClick(ev, column) {
      setIsSorted(true),
      setDescending(!descending);
    }
    /**
     * @param {import('office-ui-fabric-react').IColumn} column
     */
    function applySortProps(column) {
      column.headerClassName = [FontClassNames.medium,
        {
          borderLeft: `1px solid #F3F2F1`,
          padding: '6px 0',
          height: '100%',
          lineHeight: 44,
        }];
      column.isResizable = true;
      return column;
    }

    const virtualClusterColumn = applySortProps({
      key: 'virtualCluster',
      minWidth: 150,
      maxWidth: 200,
      name: navigatedBySubCluster ? 'Sub Cluster' : 'Virtual Cluster',
      fieldName: 'virtualCluster',
      isSorted: isSorted,
      isSortedDescending: descending,
      onColumnClick: onColumnClick,
      onRender(cluster) {
        return (
          <Stack
            horizontalAlign='space-between'
            verticalAlign='center'
            padding='s1'
          >
            <Stack.Item>
              <div className={c(t.pv1, t.darkGray)} style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                {cluster}
              </div>
            </Stack.Item>
          </Stack>
        );
      },
    });

    const tokenUsageColumn = applySortProps({
      key: 'tokenUsage',
      minWidth: 120,
      maxWidth: 200,
      name: 'Token Usage',
      fieldName: 'tokenUsage',
      onColumnClick: onColumnClick,
      onRender(cluster) {
        return (
          <Stack
            horizontalAlign='space-between'
            verticalAlign='center'
            padding='s1 0'
          >
            <StackItem className={c(t.pv1, t.darkGray)}>
              <TokenUsage
                ResourceInfo={aggregatedVirtualClusters[cluster]}
                isVirtualColumn={true}
                navigatedBySubCluster={navigatedBySubCluster}
                isShowCircle={true}
              />
            </StackItem>
          </Stack>
        );
      },
    });

    const subClusterColumn = applySortProps({
      key: 'subCluster',
      minWidth: 350,
      name: !navigatedBySubCluster ? 'Sub Cluster & Each Token Usage' : 'Virtual Cluster & Each Token Usage',
      fieldName: 'subCluster',
      onRender(cluster) {
        if (!navigatedBySubCluster) {
          const virtualClusters = aggregatedVirtualClusters[cluster];
          return (
            <Stack
              horizontal
              horizontalAlign='space-between'
              verticalAlign='center'
              padding='s1'
            >
              { virtualClusters && <StackItem styles={{root: {display: 'flex', flexWrap: 'wrap'}}}>
                {
                  Object.keys(virtualClusters).map((vc, index) => (
                    renderCluster(index, checkPermission({username: username, userGroupList: userGroupList, vc: virtualClusters[vc]}),
                      vc, cluster, virtualClusters[vc]['capacityAndResourceInfo'], navigatedBySubCluster, false, 'sub')
                  ))
                }
                </StackItem>
              }
            </Stack>
          );
        } else {
          const queue = aggregatedVirtualClusters[cluster]? aggregatedVirtualClusters[cluster]['scheduler']['schedulerInfo']['queues']['queue'] : '';
          return (
            <Stack
              horizontal
              horizontalAlign='space-between'
              verticalAlign='center'
              padding='s1'
            >
              { queue && <StackItem styles={{root: [{display: 'flex', flexWrap: 'wrap'}]}}>
                {queue.map((item, index) => {
                  if (item.queues) {
                    return (
                      item['queues']['queue'].map((subItem, idx) =>
                        (renderCluster(idx, checkPermission({username: username, userGroupList: userGroupList, vc: item}),
                          cluster, subItem['queueName'], subItem['capacityAndResourceInfo'], navigatedBySubCluster, false))
                      )
                    );
                  } else {
                    return (
                      (renderCluster(index, checkPermission({username: username, userGroupList: userGroupList, vc: item}),
                        cluster, item['queueName'], item['capacityAndResourceInfo'], navigatedBySubCluster, false))
                    );
                  }
                })}
              </StackItem>
              }
          </Stack>
        );
        }
      }
    });

    const renderCluster = (index, checkPermission, virCluster, queueName, capacityAndResourceInfo, navigatedBySubCluster, isVirtualColumn, sub) => {
      return (
        <Stack horizontal horizontalAlign='space-between' key={index} styles={{root: {marginRight: spacing.l3, padding: 0, width: 260}}}>
          <StackItem className={c(t.pv1, t.pr1, t.overflowHidden)}>
            <Link
                styles={checkPermission ? {root: [{color: '#0071bc', width: 180}]} : {root: [{color: '#858585', width: 160}]} }
                href={`./job-list.html?subCluster=${virCluster}`}
                onClick={ () => selectOneCluster(virCluster, queueName)}
              >
              {sub === 'sub' ? virCluster : queueName}
            </Link>
          </StackItem>
          <StackItem className={c(t.darkGray, t.pv1)}>
            <TokenUsage
                ResourceInfo={capacityAndResourceInfo}
                isVirtualColumn={isVirtualColumn}
                navigatedBySubCluster={navigatedBySubCluster}
                isShowCircle={false}
            />
          </StackItem>
        </Stack>
      );
    };

    const columns = [
      virtualClusterColumn,
      tokenUsageColumn,
      subClusterColumn,
    ];

    function getFilterClusters() {
      let cluster = [];
      if (navigatedBySubCluster) {
        const clusterInEnv = Object.keys(aggregatedVirtualClusters).filter((item, index) => {
          return checkPermission({username: username, userGroupList: userGroupList, vc: item}) === true;
        });
        cluster = clusterInEnv.filter((item, index) => {
          return subClusters.indexOf(item) > -1;
        });
      } else {
        if (virtualCluster) {
          cluster = Object.keys(virtualCluster).filter((item, index) => {
            return checkUserPermission(username, userGroupList, item, aggregatedVirtualClusters) === true;
          });
        }
      }
      cluster.sort(function(pre, nex) {
        return descending ? nex.localeCompare(pre) : pre.localeCompare(nex);
      });
      return cluster;
    }

    function onRenderRow(props, columnIndex) {
      const customStyles = {};
      if (props) {
        customStyles.cell = {borderLeft: `1px solid #F3F2F1`};
        if (props.itemIndex % 2 !== 0) {
          customStyles.root = {backgroundColor: '#FAFAFA'};
        }
        return <DetailsRow {...props} styles={customStyles} />;
      }
      return null;
    }

    function onRenderDetailsHeader(props) {
      const customStyles = {};
      if (props) {
        customStyles.root = {height: '100%', padding: 0};
        return <DetailsHeader {...props} styles={customStyles} />;
      }
      return null;
    }

    return (
      <Stack>
        <DetailsList
          items={getFilterClusters()}
          setKey="key"
          columns={columns}
          selectionMode={SelectionMode.none}
          onRenderRow={onRenderRow}
          onRenderDetailsHeader={onRenderDetailsHeader}
          styles={{
            root: {minWidth: 420, position: 'relative', overflow: 'visible'},
            headerWrapper: {position: 'sticky', height: 44, top: 0, zIndex: 20},
          }}
        />
      </Stack>
    );
  };

  const MyVirtualCluster = ({subClusters, virtualCluster2Subclusters, virtualCluster, aggregatedVirtualClusters, userGroupList}) => {
    const [navigatedBySubCluster, setNavigatedBySubCluster] = useState(getCurNavigated());

    function getCurNavigated() {
      if ( cookies.get('navigatedBySubCluster')) {
        const navigated = eval(cookies.get('navigatedBySubCluster').toLowerCase());
        return navigated;
      } else {
        return false;
      }
    }

    function _onToggleChanged(isChecked) {
      setNavigatedBySubCluster(isChecked);
      cookies.set('navigatedBySubCluster', isChecked, {expires: 7});
    }

    const filterVirtualClusters = (Clusters) => {
      let filterVirtualClusters = {};
      for (let sub in Clusters) {
        if (JSON.stringify(Clusters[sub]) != '{}' ) {
          filterVirtualClusters[sub] = Clusters[sub];
        }
      }
      return filterVirtualClusters;
    };

  return (
    <Stack styles={{root: {width: '100%', height: '100%', minWidth: 630}}} className={c(t.overflowYAuto)}>
      <Stack horizontal horizontalAlign='space-between'
        styles={{root: {height: 50}}}
        className={c(t.bgWhite, t.bb, ColorClassNames.neutralQuaternaryBorder, t.itemsCenter, t.pa3)}
      >
        <StackItem styles={{root: {fontWeight: 600}}}>
          {navigatedBySubCluster ? 'My sub clusters' : 'My virtual clusters'}
        </StackItem>
        <StackItem>
          <Toggle
            label={!navigatedBySubCluster ? 'Navigate by virtual cluster' : 'Navigate by sub cluster'}
            defaultChecked={navigatedBySubCluster}
            onChange={((ev, isChecked) =>_onToggleChanged(isChecked))}
            styles={{
              root: {display: 'flex', alignItems: 'center', margin: 0},
              label: {padding: 0, marginRight: spacing.s1},
            }}
          />
        </StackItem>
      </Stack>
      <Stack grow={1} className={c(t.overflowAuto, t.borderBox, t.pr1, t.relative)} styles={{root: {left: -1}}}>
        <ScrollXYBarStyles>
          <MyClustersList
            subClusters={subClusters}
            aggregatedVirtualClusters={navigatedBySubCluster ? filterVirtualClusters(aggregatedVirtualClusters.Clusters) : applyDrawingData(virtualCluster2Subclusters.virtualClusters)}
            userGroupList={userGroupList}
            virtualCluster={virtualCluster}
            navigatedBySubCluster={navigatedBySubCluster}
          />
        </ScrollXYBarStyles>
      </Stack>
    </Stack>
  );
};

MyVirtualCluster.propTypes = {
    subClusters: PropTypes.array.isRequired,
    userGroupList: PropTypes.object.isRequired,
    aggregatedVirtualClusters: PropTypes.object.isRequired,
    virtualCluster2Subclusters: PropTypes.object.isRequired,
    virtualCluster: PropTypes.object,
};

export default MyVirtualCluster;
