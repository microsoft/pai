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
import {isEmpty} from 'lodash';
import PropTypes from 'prop-types';
import querystring from 'querystring';
import {Stack, FontClassNames, ColorClassNames, ActionButton, getTheme} from 'office-ui-fabric-react';
import React from 'react';

import Card from './card';

import t from '../../components/tachyons.scss';
import {checkUserPermission, checkPermission} from './util'

const username = cookies.get('user');

const StatusItem = ({className, subCluster, virtualClusters, userGroupList, navigatedByCluster}) => {
    return (
        <Stack
            styles={{root: [{minWidth: 280, 'margin-right': '1px', 'margin-left': '1px', 'padding-left': '1px', 'padding-right': '1px'}, className]}}
            horizontal
            horizontalAlign='space-between'
            verticalAlign='center'
            padding='s1'
        >
            <Stack.Item>
                <ActionButton
                    styles={{root: [{'width': 300, 'font-size': '16px', 'color': 'rgb(0, 113, 188)'}]}}
                    text={subCluster}
                    href={navigatedByCluster ? `./job-list.html?subCluster=${subCluster}` : ``}
                    onClick={ () => selectOneCluster(navigatedByCluster, subCluster)}
                />
            </Stack.Item>
            { virtualClusters && <Stack.Item styles={{root: [{maxWidth: 800}]}}>
              { Object.keys(virtualClusters).map((vc, index) => (
                 <ActionButton
                    styles={!checkPermission({username: username, userGroupList: userGroupList, vc: virtualClusters[vc]}) ? {root: [{'font-size': '16px'}]} : {root: [{'font-size': '16px', 'color': 'rgb(0, 113, 188)'}]}}
                    text={vc}
                    key={index}
                    href={navigatedByCluster ? `./job-list.html?subCluster=${subCluster}` : `./job-list.html?subCluster=${vc}`}
                    onClick={ () => selectOneCluster(navigatedByCluster, subCluster, vc)}
                />)
                 )
              }
            </Stack.Item>
            }
        </Stack>
    );
};

StatusItem.propTypes = {
  className: PropTypes.string,
  subCluster: PropTypes.string.isRequired,
  navigatedByCluster: PropTypes.bool,
};

function selectOneCluster(navigatedByCluster, subCluster, vc) {
  if (navigatedByCluster) {
    cookies.set('subClusterUri', subCluster, {expires: 7});
    cookies.set('virtualClusterUri', vc ? [vc] : [], {expires: 7});
  } else {
    cookies.set('virtualClusterUri', [subCluster], {expires: 7});
    if (vc) {
      cookies.set('subClusterUri', vc, {expires: 7});
    }
  }
}


const AllSubClusters = ({className, displayStr, subClusters, aggregatedVirtualClusters, userGroupList, listMy, navigatedByCluster}) => {
    return (
        <Card className={className}>
            <Stack gap='l1'>
                <Stack.Item>
                    <div className={FontClassNames.xLargePlus}>
                     {displayStr} 
                    </div>
                </Stack.Item>
                <Stack.Item>
                    <div className={t.overflowXAuto}>
                        {subClusters.map((subCluster, index) => (
                          !(listMy ^ checkUserPermission(username, userGroupList, subCluster, aggregatedVirtualClusters)) && (<StatusItem
                                className={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
                                subCluster={subCluster}
                                virtualClusters={aggregatedVirtualClusters? aggregatedVirtualClusters[subCluster] : ""}
                                userGroupList={userGroupList}
                                navigatedByCluster={navigatedByCluster}
                                key={index}
      
                            />))
                        )
                        }
                    </div>
                </Stack.Item>
            </Stack>
        </Card>
    ); 
  }

  const SelectSubcluster = ({className, subClusters, aggregatedVirtualClusters, userGroupList, navigatedByCluster}) => {
    return (
      <Stack
          styles={{root: [t.w100, t.h100L]}}
          padding='l2'
          gap='l2'
      >
        {/* my virtual clusters */}
        <Stack.Item>
          <AllSubClusters className={className} displayStr="My virtual clusters" subClusters={subClusters} aggregatedVirtualClusters={aggregatedVirtualClusters} userGroupList={userGroupList} listMy={true} navigatedByCluster={navigatedByCluster}/> {/*  My virtual clusters */}
          { }
        </Stack.Item>
        {/* other virtual clusters */}
        <Stack.Item>
          <AllSubClusters className={className} displayStr="Other virtual clusters" subClusters={subClusters} aggregatedVirtualClusters={aggregatedVirtualClusters} userGroupList={userGroupList} listMy={false} navigatedByCluster={navigatedByCluster}/> {/*  Other virtual clusters here */}
          { }
        </Stack.Item>
      </Stack>
  );
};

SelectSubcluster.propTypes = {
    className: PropTypes.string,
    subClusters: PropTypes.array,
    aggregatedVirtualClusters: PropTypes.object,
    userGroupList: PropTypes.object,
    navigatedByCluster: PropTypes.bool,
};

export default SelectSubcluster;
