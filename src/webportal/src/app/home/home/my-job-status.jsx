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
import {FontClassNames} from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';
import {Stack, StackItem, Label, ColorClassNames, ChoiceGroup, getTheme} from 'office-ui-fabric-react';
import React, {useState} from 'react';
import t from '../../components/tachyons.scss';
import {statusColor} from '../../components/theme';
import {getJobStatus, getCurrentDate} from './getJobStatus';
const {spacing} = getTheme();

const MyJobStatus = ({jobs, userGroupList, getTimeScale}) => {
  const comboBoxBasicOptions = [
    {key: 'LastTFHours', text: 'Last 24 hours', styles: {choiceFieldWrapper: {marginLeft: 20}}},
    {key: 'RecentSevenDays', text: 'Recent 7 days', styles: {choiceFieldWrapper: {marginLeft: 20}}},
  ];
  const [timeScale, setTimeScale] = useState(cookies.get('timeScale') && cookies.get('timeScale') === 'RecentSevenDays' ? comboBoxBasicOptions[1] : comboBoxBasicOptions[0]);

  const timeScaleCallback = (e, Executors) => {
    setTimeScale(Executors);
    getTimeScale(Executors.key);
    cookies.set('timeScale', Executors.key, {expires: 7});
  };

  const JobStatus = ({status}) => {
    const {failed, failedToday, waiting, running, succeeded, succeededToday, stopped, stoppedToday} = status;
    const statusInfoObj = {
      'Failed': [timeScale.key === 'LastTFHours' ? failedToday : failed, statusColor.failed],
      'Waiting': [waiting, statusColor.waiting],
      'Running': [running, statusColor.running],
      'Succeeded': [timeScale.key === 'LastTFHours' ? succeededToday : succeeded, statusColor.succeeded],
      'Stopped': [timeScale.key === 'LastTFHours' ? stoppedToday : stopped, statusColor.unknown],
    };
    return (
      <Stack grow={1} styles={{root: {flexDirection: 'row!important'}}} className={c(t.flex, t.justifyBetween, t.itemsCenter, t.pt3)} >
        { Object.keys(statusInfoObj).map((status, index) => (
            <StatusItem
              name={status}
              key={index}
              count={statusInfoObj[status][0]}
              color={statusInfoObj[status][1]}
            />
        ))
        }
      </Stack>
    );
  };

  const StatusItem = ({name, count, color}) => {
    return (
      <Stack className={c(t.ph3)} styles={{root: {borderLeft: `4px solid ${color}`}}}>
        <StackItem >
          <div style={{fontWeight: 600}} className={c(t.black, FontClassNames.large, t.lhSolid)}>
            {name}
          </div>
        </StackItem>
        <Stack.Item>
          <div className={c(FontClassNames.superLarge)} style={{color: color, fontWeight: 700}}>
            {count >= 1000 ? (count / 1000).toFixed(1) + 'K' : count }
          </div>
        </Stack.Item>
      </Stack>
    );
  };

  const status = getJobStatus(jobs, userGroupList);
  return (
    <Stack styles={{root: {height: '100%'}}}>
      <div style={{fontWeight: 600, height: 50}} className={c(t.bb, ColorClassNames.neutralQuaternaryBorder, t.pa3)}>
        Job status for my virtual clusters
      </div>
      <Stack grow={1} className={c(t.ph5, t.pv4)}>
        <div style={{fontWeight: 700}} className={c(t.black, FontClassNames.xxLarge)}>Overview</div>
        <Stack horizontal horizontalAlign='space-between'>
          <ChoiceGroup
            label='Show status by:'
            defaultSelectedKey={timeScale.key}
            options={comboBoxBasicOptions}
            onChange={timeScaleCallback}
            styles={{
              root: {display: 'flex'},
              label: {padding: 0, marginTop: spacing.s1, lineHeight: 26, fontWeight: 500},
              flexContainer: {display: 'flex'},
            }}
          />
          <Label className={c(ColorClassNames.gray, FontClassNames.small)} styles={{root: {padding: 0, marginTop: spacing.s1, lineHeight: 26}}}>
            {getCurrentDate(new Date(), timeScale.text)}
          </Label>
        </Stack>
        <JobStatus status={status} />
      </Stack>
    </Stack>
  );
};

MyJobStatus.propTypes = {
  jobs: PropTypes.object.isRequired,
  userGroupList: PropTypes.object.isRequired,
};

export default MyJobStatus;
