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
import {Icon, Stack, StackItem, ColorClassNames, Link, getTheme} from 'office-ui-fabric-react';
import React from 'react';
import {statusColor} from '../../components/theme';
import {getJobStatus} from './getJobStatus';
import {ScrollYBarStyles} from '../components/scrollbar-styles';
const {spacing} = getTheme();

import t from '../../components/tachyons.scss';

const FailedJobs = ({jobs, userGroupList, timeScale}) => {
  const {failedVc, failedVcToday} = getJobStatus(jobs, userGroupList);
  
  return (
    <Stack styles={{root: {width: '100%', height: '100%'}}} className={c(t.overflowYAuto)}>
      <Stack
        styles={{root: {fontWeight: 600, height: 50, borderLeft: `4px solid ${statusColor.failed}`, paddingLeft: 12}}}
        className={c(t.bb, ColorClassNames.neutralQuaternaryBorder, t.pv3, t.pr3, t.borderBox)}
      >
        Failed jobs by virtual clusters
      </Stack>
      <Stack styles={{root: {width: '100%'}}} grow={1} className={c(t.overflowAuto, t.borderBox, t.pr1)}>
        <FailedVCList
          failedVirtualClusters={timeScale === 'LastTFHours' ? failedVcToday : failedVc}
        />
      </Stack>
    </Stack>
  );
};

const FailedVCList = ({failedVirtualClusters}) => {
  const calculateTotalCount = (subCountObj) => {
    let countArr = Object.keys(subCountObj).map((sub, idx) => {
      return subCountObj[sub].count;
    });
    return countArr.reduce((prev, curr) => {
      return prev + curr;
    });
  };

  function selectOneCluster(subCluster, vc) {
    cookies.set('subClusterUri', subCluster, {expires: 7});
    cookies.set('virtualClusterUri', [vc], {expires: 7});
    cookies.set('status', ['Failed'], {expires: 7});
  }

  if (Object.keys(failedVirtualClusters).length === 0) {
    return (
      <div className={c(ColorClassNames.neutralSecondary, ColorClassNames.neutralQuaternaryBorder, t.pa2, t.tc)} >
        No failed job by virtual clusters
      </div>
    );
  } else {
    return (
      <ScrollYBarStyles>
        {
          Object.keys(failedVirtualClusters).map((name, index) => (
            <Stack horizontal horizontalAlign='space-between'
              key={index}
              className={c(t.pv2, t.ph3, t.borderBox, ColorClassNames.neutralLighterBackgroundHover)}
              styles={{root: {backgroundColor: index % 2 !== 0 ? '#FAFAFA' : '#ffffff'}}}
              >
              <StackItem className={c(t.pa1)} styles={{root: {minWidth: 200, wordBreak: 'break-all'}}}>
                <span className={c(t.darkGray, t.pr1)}>{name}</span>
                <label style={{color: statusColor.failed}}>
                  {'(' + calculateTotalCount(failedVirtualClusters[name]) + ')'}
                </label>
              </StackItem>
              <StackItem styles={{root: {display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse'}}}>
                {Object.keys(failedVirtualClusters[name]).map((sub, itemIndex) =>(
                  (<Stack horizontal horizontalAlign='space-between' key={itemIndex} styles={{root: {width: 190, marginLeft: spacing.l1}}} className={c(t.pa1, t.flex)}>
                    <Link
                      key={itemIndex}
                      className={c(t.pr1)}
                      onClick={() => selectOneCluster(sub, name)}
                      href={`./job-list.html?subCluster=${sub}`}
                    >
                      {sub}
                    </Link>
                    <StackItem styles={{root: {display: 'flex', flexWrap: 'no-wrap'}}}>
                      <Icon
                        iconName='Warning'
                        styles={{root: {color: statusColor.failed, transform: 'translateY(1px)'}}}
                      />
                      <label style={{color: statusColor.failed}}>
                        {failedVirtualClusters[name][sub].count}
                      </label>
                    </StackItem>
                  </Stack>)
                ))}
              </StackItem>
            </Stack>
          ))
        }
      </ScrollYBarStyles>
    );
  }
};

FailedVCList.propTypes ={
  failedVirtualClusters: PropTypes.object.isRequired,
};
FailedJobs.propTypes = {
  jobs: PropTypes.object.isRequired,
  userGroupList: PropTypes.object.isRequired,
};


export default FailedJobs;
