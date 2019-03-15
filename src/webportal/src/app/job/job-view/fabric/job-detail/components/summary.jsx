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

import {ColorClassNames, FontClassNames, FontWeights, FontSizes} from '@uifabric/styling';
import c from 'classnames';
import {isEmpty, isNil} from 'lodash';
import {DateTime} from 'luxon';
import {ActionButton, DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {Dropdown} from 'office-ui-fabric-react/lib/Dropdown';
import {Link} from 'office-ui-fabric-react/lib/Link';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../tachyons.css';

import Card from './card';
import MonacoPanel from './monaco-panel';
import StatusBadge from './status-badge';
import Timer from './Timer';
import {getJobMetricsUrl, cloneJob} from '../conn';
import {printDateTime, getHumanizedJobStateString, getDurationString} from '../util';

const StoppableStatus = [
  'Running',
  'Waiting',
];

export default class Summary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      monacoProps: null,
      modalTitle: '',
      autoReloadInterval: 10 * 1000,
    };

    this.onDismiss = this.onDismiss.bind(this);
    this.showEditor = this.showEditor.bind(this);
    this.onChangeInterval = this.onChangeInterval.bind(this);
  }

  onDismiss() {
    this.setState({
      monacoProps: null,
      modalTitle: '',
    });
  }

  showEditor(title, props) {
    this.setState({
      monacoProps: props,
      modalTitle: title,
    });
  }

  onChangeInterval(e, item) {
    this.setState({autoReloadInterval: item.key});
  }

  render() {
    const {autoReloadInterval, modalTitle, monacoProps} = this.state;
    const {className, jobInfo, jobConfig, reloading, onStopJob, onReload} = this.props;

    return (
      <div className={className}>
        {/* summary */}
        <Card className={c(t.pv4)} style={{paddingLeft: 32, paddingRight: 32}}>
          {/* summary-row-1 */}
          <div className={c(t.flex, t.justifyBetween, t.itemsCenter)}>
            <div
              className={c(t.truncate)}
              style={{
                fontSize: FontSizes.xLarge,
                fontWeight: FontWeights.regular,
              }}
            >
              {jobInfo.name}
            </div>
            <div className={c(t.flex, t.itemsCenter)}>
              <Dropdown
                styles={{title: {border: 0}}}
                dropdownWidth={180}
                selectedKey={autoReloadInterval}
                onChange={this.onChangeInterval}
                options={[
                  {key: 0, text: 'Disable Auto Refresh'},
                  {key: 10000, text: 'Refresh every 10s'},
                  {key: 30000, text: 'Refresh every 30s'},
                  {key: 60000, text: 'Refresh every 60s'},
                ]}
              />
              <ActionButton
                className={t.ml2}
                iconProps={{iconName: 'Refresh'}}
                disabled={reloading}
                onClick={onReload}
              >
                Refresh
              </ActionButton>
            </div>
          </div>
          {/* summary-row-2 */}
          <div className={c(t.mt3, t.flex, t.itemsStart)}>
            <div>
              <div className={c(t.gray, FontClassNames.small)}>Status</div>
              <div className={c(t.mt2)}>
                <StatusBadge status={getHumanizedJobStateString(jobInfo)}/>
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.small)}>Start Time</div>
              <div className={c(t.mt2)}>
                {printDateTime(DateTime.fromMillis(jobInfo.jobStatus.createdTime))}
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.small)}>User</div>
              <div className={c(t.mt2)}>{jobInfo.jobStatus.username}</div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.small)}>Virtual Cluster</div>
              <div className={c(t.mt2)}>{jobInfo.jobStatus.virtualCluster}</div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.small)}>Duration</div>
              <div className={c(t.mt2)}>{getDurationString(jobInfo)}</div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.small)}>Retries</div>
              <div className={c(t.mt2)}>{jobInfo.jobStatus.retries}</div>
            </div>
          </div>
          {/* summary-row-3 */}
          <div className={c(t.mt3, t.flex, t.justifyBetween, t.itemsCenter)}>
            <div className={c(t.flex)}>
              <Link
                styles={{root: [ColorClassNames.neutralTertiary]}}
                href='#'
                disabled={isNil(jobConfig)}
                onClick={() => {
                  this.showEditor('Job Config', {
                    language: 'json',
                    value: JSON.stringify(jobConfig, null, 2),
                  });
                }}
              >
                View Job Config
              </Link>
              <div className={c(t.bl, t.mh3)}></div>
              <Link
                styles={{root: [ColorClassNames.neutralTertiary]}}
                href='#'
                disabled={isEmpty(jobInfo.jobStatus.appExitDiagnostics)}
                onClick={() => {
                  this.showEditor('Application Summary', {
                    language: 'text',
                    value: jobInfo.jobStatus.appExitDiagnostics || '',
                  });
                }}
              >
                View Application Summary
              </Link>
              <div className={c(t.bl, t.mh3)}></div>
              <Link
                styles={{root: [ColorClassNames.neutralTertiary]}}
                href={jobInfo.jobStatus.appTrackingUrl}
                target="_blank"
              >
                Go to Application Tracking Page
              </Link>
              <div className={c(t.bl, t.mh3)}></div>
              <Link
                styles={{root: [ColorClassNames.neutralTertiary]}}
                href={getJobMetricsUrl()}
                target="_blank"
              >
                Go to Job Metrics Page
              </Link>
            </div>
            <div>
              <DefaultButton
                text='Clone'
                onClick={() => cloneJob(jobConfig)}
                disabled={isNil(jobConfig)}
              />
              <DefaultButton
                className={c(t.ml4)}
                text='Stop'
                onClick={onStopJob}
                disabled={!StoppableStatus.includes(getHumanizedJobStateString(jobInfo))}
              />
            </div>
          </div>
          {/* Monaco Editor Modal */}
          <MonacoPanel
            isOpen={!isNil(monacoProps)}
            onDismiss={this.onDismiss}
            title={modalTitle}
            monacoProps={monacoProps}
          />
          {/* Timer */}
          <Timer interval={autoReloadInterval === 0 ? null : autoReloadInterval} func={onReload} />
        </Card>
      </div>
    );
  }
}

Summary.propTypes = {
  className: PropTypes.string,
  jobInfo: PropTypes.object.isRequired,
  jobConfig: PropTypes.object,
  reloading: PropTypes.bool.isRequired,
  onStopJob: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
};
