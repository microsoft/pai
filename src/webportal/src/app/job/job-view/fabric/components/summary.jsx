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
import {DateTime} from 'luxon';
import {DefaultButton, IconButton} from 'office-ui-fabric-react/lib/Button';
import {Link} from 'office-ui-fabric-react/lib/Link';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../tachyons.css';

import Card from './card';
import {StatusBadge} from './status-badge.jsx';
import {printDateTime, getHumanizedJobStateString, getDurationString} from '../util.js';

const StoppableStatus = [
  'Running',
  'Waiting',
];

const Summary = ({className, jobInfo}) => (
  <div className={className}>
    {/* summary */}
    <Card className={c(t.pv4)}>
      {/* summary-row-1 */}
      <div className={c(t.flex, t.ph6, t.pv3)}>
        <div className={c(t.w50, t.flex, t.justifyBetween, t.itemsCenter)}>
          <div className={c(t.f2, t.mw7, t.truncate)}>
            {jobInfo.name}
          </div>
          <div className={[c(t.flex, t.ml4, t.mr6, t.itemsCenter)]}>
            <div>
              <StatusBadge status={getHumanizedJobStateString(jobInfo)}/>
            </div>
            <div className={c(t.mh4, t.gray)}>
              {printDateTime(DateTime.fromMillis(jobInfo.jobStatus.createdTime))}
            </div>
            <div>
              <IconButton
                styles={{
                  icon: {
                    color: 'gray',
                  },
                }}
                iconProps={{iconName: 'refresh'}}
              />
            </div>
          </div>
        </div>
        <div className={c(t.w50, t.bl, t.bBlack10)}>
          <div className={c(t.mh6, t.flex, t.itemsCenter, t.h100)}>
            <div>
              <div className={c(t.gray, t.f4)}>User</div>
              <div>{jobInfo.jobStatus.username}</div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, t.f4)}>Virtual Cluster</div>
              <div>{jobInfo.jobStatus.virtualCluster}</div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, t.f4)}>Duration</div>
              <div>{getDurationString(jobInfo)}</div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, t.f4)}>Retries</div>
              <div>{jobInfo.jobStatus.retries}</div>
            </div>
          </div>
        </div>
      </div>
      {/* summary-row-2 */}
      <div className={c(t.mt3, t.ph6, t.flex, t.justifyBetween, t.itemsCenter)}>
        <div className={c(t.flex)}>
          <Link
            styles={{root: {color: 'gray'}}}
            href='#'
          >
            View Job Config
          </Link>
          <div className={c(t.bl, t.mh3)}></div>
          <Link
            styles={{root: {color: 'gray'}}}
            href='#'
          >
            View Application Summary
          </Link>
          <div className={c(t.bl, t.mh3)}></div>
          <Link
            styles={{root: {color: 'gray'}}}
            href='#'
          >
            Go to Application Tracking Page
          </Link>
          <div className={c(t.bl, t.mh3)}></div>
          <Link
            styles={{root: {color: 'gray'}}}
            href='#'
          >
            Go to Job Metrics Page
          </Link>
        </div>
        <div>
          <DefaultButton
            text='Clone'
          />
          <DefaultButton
            className={c(t.ml4)}
            text='Stop'
            disabled={!StoppableStatus.includes(getHumanizedJobStateString(jobInfo))}
          />
        </div>
      </div>
    </Card>
  </div>
);

Summary.propTypes = {
  className: PropTypes.string,
  jobInfo: PropTypes.object.isRequired,
};

export default Summary;
