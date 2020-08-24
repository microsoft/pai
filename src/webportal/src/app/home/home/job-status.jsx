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
import querystring from 'querystring';
import {
  Stack,
  FontClassNames,
  ColorClassNames,
  DefaultButton,
  FontWeights,
  getTheme,
} from 'office-ui-fabric-react';
import React from 'react';
import styled from 'styled-components';

import StatusBadge from '../../components/status-badge';
import Card from '../../components/card';

import t from '../../components/tachyons.scss';

const isAdmin = cookies.get('admin') === 'true';
const StatusRow = ({ cellClassName, icon, name, count, link }) => {
  const { spacing } = getTheme();
  const TableRow = styled.tr`
    td {
      padding: ${spacing.s1};
    }
  `;
  return (
    <TableRow>
      <td className={cellClassName}>
        <div className={c(t.w4)}>
          <StatusBadge status={name} />
        </div>
      </td>
      <td className={cellClassName}>
        <div
          className={c(FontClassNames.large)}
          style={{ fontWeight: FontWeights.bold }}
        >
          {count}
        </div>
      </td>
      <td style={{ textAlign: 'right' }} className={cellClassName}>
        <DefaultButton
          styles={{ root: [{ width: 100 }] }}
          text='View all'
          href={link}
        />
      </td>
    </TableRow>
  );
};

StatusRow.propTypes = {
  cellClassName: PropTypes.string,
  icon: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  link: PropTypes.string.isRequired,
};

const JobStatus = ({ className, style, jobStatusNumber }) => {
  if (jobStatusNumber === undefined) {
    jobStatusNumber = {};
  }
  const waiting = jobStatusNumber.waiting || 0;
  const running = jobStatusNumber.running || 0;
  const stopped = jobStatusNumber.stopped || 0;
  const failed = jobStatusNumber.failed || 0;
  const succeeded = jobStatusNumber.succeeded || 0;

  return (
    <Card className={c(className, t.ph5)} style={style}>
      <Stack gap='l1'>
        <div className={FontClassNames.mediumPlus}>
          {isAdmin ? 'Job Status' : 'My job status'}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <StatusRow
              cellClassName={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='Clock'
              name='Waiting'
              count={waiting}
              link={`/job-list.html?${querystring.stringify({
                status: 'Waiting',
                user: isAdmin ? undefined : cookies.get('user'),
              })}`}
            />
            <StatusRow
              cellClassName={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='Running'
              name='Running'
              count={running}
              link={`/job-list.html?${querystring.stringify({
                status: 'Running',
                user: isAdmin ? undefined : cookies.get('user'),
              })}`}
            />
            <StatusRow
              cellClassName={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='ErrorBadge'
              name='Stopped'
              count={stopped}
              link={`/job-list.html?${querystring.stringify({
                status: 'Stopped',
                user: isAdmin ? undefined : cookies.get('user'),
              })}`}
            />
            <StatusRow
              cellClassName={c(t.bb, ColorClassNames.neutralQuaternaryBorder)}
              icon='Blocked'
              name='Failed'
              count={failed}
              link={`/job-list.html?${querystring.stringify({
                status: 'Failed',
                user: isAdmin ? undefined : cookies.get('user'),
              })}`}
            />
            <StatusRow
              icon='Completed'
              name='Succeeded'
              count={succeeded}
              link={`/job-list.html?${querystring.stringify({
                status: 'Succeeded',
                user: isAdmin ? undefined : cookies.get('user'),
              })}`}
            />
          </tbody>
        </table>
      </Stack>
    </Card>
  );
};

JobStatus.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  jobStatusNumber: PropTypes.object,
};

export default JobStatus;
