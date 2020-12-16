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

import {FontClassNames, FontWeights, FontSizes} from '@uifabric/styling';
import c from 'classnames';
import {get, isEmpty, isNil} from 'lodash';
import {DateTime} from 'luxon';
import {ActionButton, DefaultButton, PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import {Dropdown} from 'office-ui-fabric-react/lib/Dropdown';
import { ComboBox, Link } from "office-ui-fabric-react";
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';
import t from '../../../../../components/tachyons.scss';
import Card from './card';
import Context from './context';
import Timer from './timer';
import {printDateTime, isClonable, isJobV2} from '../util';
import MonacoPanel from '../../../../../components/monaco-panel';
import StatusBadge from '../../../../../components/status-badge';
import {getJobDurationString, getHumanizedJobStateString, getVersionDurationString} from '../../../../../components/util/job';
import utils from '../../../../../spark-debugging/models/utils/convert-utils';
import ResourceInfoRelatedPanel from "./ResourceInfoRelated-Panel";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";


const StoppableStatus = [
  'Preparing',
  'Running',
  'Waiting',
];

const HintItem = ({header, children}) => (
  <div className={c(t.flex, t.justifyStart)}>
    <div style={{width: '160px', minWidth: '160px', fontWeight: FontWeights.semibold}}>
      {header}
    </div>
    <div>{children}</div>
  </div>
);

HintItem.propTypes = {
  header: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default class Summary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      autoReloadInterval: 0,
    };
    this.onChangeInterval = this.onChangeInterval.bind(this);
    this.handleFocusOnVersion = this.handleFocusOnVersion.bind(this);
    this.handleVersionChange = this.handleVersionChange.bind(this);
  }

  onChangeInterval(e, item) {
    this.setState({autoReloadInterval: item.key});
  }

  getUserFailureHintItems(jobInfo) {
    const result = [];
    const runtimeOutput = get(jobInfo, 'jobStatus.appExitMessages.runtime');
    // reason
    const reason = [];
    // static reason
    const spec = get(jobInfo, 'jobStatus.appExitSpec');
    if (spec && spec.reason) {
      reason.push(
        <div key='spec-reason'>{spec.reason}</div>,
      );
    }
    // dynamic reason
    const code = jobInfo.jobStatus.appExitCode;
    if (code > 0) {
      if (runtimeOutput && runtimeOutput.reason) {
        reason.push(
          <div key='runtime-reason'>{runtimeOutput.reason}</div>,
        );
      }
    } else {
      const launcherOutput = get(jobInfo, 'jobStatus.appExitMessages.launcher');
      if (launcherOutput) {
        reason.push(
          <div key='launcher-reason'>{launcherOutput}</div>,
        );
      }
    }
    if (!isEmpty(reason)) {
      result.push(<HintItem key='reason' header='Exit Reason:'>{reason}</HintItem>);
    }
    // solution
    const solution = [];
    if (runtimeOutput && runtimeOutput.solution) {
      solution.push(
        <li key='runtime-solution'>{runtimeOutput.solution}</li>,
      );
    }
    if (spec && spec.solution) {
      solution.push(
        ...spec.solution.map((x, i) => (
          <li key={`spec-reason-${i}`}>{x}</li>
        )),
      );
    }
    if (!isEmpty(solution)) {
      result.push(
        <HintItem key='solution' header='Exit Solutions:'>
          <ul className={c(t.pa0, t.ma0)} style={{listStyle: 'inside'}}>
            {solution}
          </ul>
        </HintItem>
      );
    }
    
    // hard code here for the demo
    return [];
  }

  renderHintMessage() {
    const {jobInfo} = this.props;
    if (!jobInfo) {
      return;
    }

    const state = getHumanizedJobStateString(jobInfo.jobStatus);
    if (state === 'Failed') {
      const result = [];
      const spec = jobInfo.jobStatus.appExitSpec;
      const type = spec && spec.type;
      // exit code
      const code = jobInfo.jobStatus.appExitCode;
      result.push(<HintItem key='platform-exit-code' header='Exit Code:'>{code}</HintItem>);
      // type
      if (type) {
        result.push(<HintItem key='type' header='Exit Type:'>{type}</HintItem>);
      }
      if (type === 'USER_FAILURE' || type === 'UNKNOWN_FAILURE') {
        result.push(...this.getUserFailureHintItems(jobInfo));
      } else {
        result.push(<HintItem key='solution' header='Exit Solutions:'>
          Please send the <Link onClick={this.showExitDiagnostics}>exit diagnostics</Link> to your administrator for further investigation.
        </HintItem>);
      }

      return (
        <MessageBar messageBarType={MessageBarType.error}>
          <div>
            {result}
          </div>
        </MessageBar>
      );
    } else if (state === 'Waiting') {
      const resourceRetries = get(jobInfo, 'jobStatus.retryDetails.resource');
      if (resourceRetries >= 3) {
        return (
          <MessageBar messageBarType={MessageBarType.warning}>
            <div>
              <HintItem key='conflict-retry-count' header='Conflict Count:'>
                  {resourceRetries}
              </HintItem>
              <HintItem key='resolution' header='Resolution:'>
                <div>
                  Please adjust the resource requirement in your <Link onClick={this.showJobConfig}>job config</Link>, or wait till other jobs release more resources back to the system.
                </div>
              </HintItem>
            </div>
          </MessageBar>
        );
      }
    }
  }

  handleFocusOnVersion() {
    const { versionItemsFetched, reloadVersions } = this.props;
    if (versionItemsFetched) return;
    reloadVersions();
  }

  handleVersionChange(e, option, index, value) {
    const { setJobDetailState, selectedVersion } = this.props;
    const version = Number(isNil(value) ? option.text : value).toString();
    if (version !== selectedVersion) {
      setJobDetailState({
        selectedVersion: version,
        selectedAttemptId: null,
      });
    }
  }

  render() {
    const {autoReloadInterval} = this.state;
    const {
      className,
      vcInfo,
      jobInfo,
      reloading,
      onStopJob,
      onReload,
      renderVersionComboBox,
      selectedVersion,
      versionItems,
      versionItemsFetched,
      resourceRelatedWarning,
      modalTitle,
      monacoProps,
      showResourcePanel,
      resourceRequests,
      onDismiss,
      onShowResourcePanel,
      onCloseResourcePanel,
      onShowExitDiagnostics,
    } = this.props;
    const {rawJobConfig, launcherHistoryInfo} = this.context;
    const hintMessage = this.renderHintMessage();
    const {retries} = jobInfo.jobStatus;
    const retry = typeof retries === 'string' ? (retries.trim().toLowerCase() === 'unknown' ? '--' : retries) : retries;
    const params = new URLSearchParams(window.location.search);
    const subCluster = params.get('subCluster');

    return (
      <div className={className}>
        {/* summary */}
        <Card className={c(t.pv4, t.ph5)}>
          {/* summary-row-1 */}
          <div className={c(t.flex, t.justifyBetween, t.itemsCenter)}>
            <div
              className={c(t.truncate)}
              style={{
                fontSize: FontSizes.xxLarge,
                fontWeight: FontWeights.regular,
              }}
            >
              {jobInfo.jobStatus.name}
            </div>
            {(jobInfo.jobStatus.jobType === "LAUNCHER" ||
            jobInfo.jobStatus.jobType === "JOBWRAPPER") &&
             <div className={c(t.flex, t.itemsCenter, t.justifyEnd, t.mb2)}>
              {versionItemsFetched && !versionItems.length && (
                <Spinner className={c(t.mr1)} size={SpinnerSize.medium} />
              )}
              <span className={c(t.mr2)}>Version:</span>
              <ComboBox
                styles={{root: {width: 100}}}
                options={versionItems}
                text={selectedVersion}
                onChange={this.handleVersionChange}
                onFocus={this.handleFocusOnVersion}
                allowFreeform={true}
                autoComplete="off"
              />
            </div>}
          </div>
          {/* summary-row-2 */}
          <div className={c(t.mt4, t.flex, t.itemsStart, t.overflowAuto, t.pb2)}>
            <div>
              <div className={c(t.gray, FontClassNames.medium)}>Status</div>
              <div className={c(t.mt3)}>
                <StatusBadge status={getHumanizedJobStateString(jobInfo.jobStatus)}/>
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>User</div>
              <div className={c(t.mt3, FontClassNames.medium)}>
                {jobInfo.jobStatus.username}
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium, t.nowrap)}>Virtual Cluster</div>
              <div className={c(t.mt3, FontClassNames.medium)}>
                {jobInfo.jobStatus.virtualCluster}
              </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>Priority</div>
              <div className={c(t.mt3, FontClassNames.medium)}>
                {jobInfo.jobStatus.priority}
              </div>
            </div>
            <div className={t.ml5}>
                <div className={c(t.gray, FontClassNames.medium)}>SubmissionTime</div>
                <div className={c(t.mt3, FontClassNames.medium, t.nowrap)}>
                  {utils.date('Y/m/d H:i:s', jobInfo.jobStatus.createdTime)}
                </div>
            </div>
            <div className={t.ml5}>
                <div className={c(t.gray, FontClassNames.medium)}>FinishTime</div>
                <div className={c(t.mt3, FontClassNames.medium, t.nowrap)}>
                  {jobInfo.jobStatus.completedTime == 0 ? null : utils.date('Y/m/d H:i:s', jobInfo.jobStatus.completedTime)}
                </div>
            </div>
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>Duration</div>
              <div className={c(t.mt3, FontClassNames.medium)}>
                {getJobDurationString(jobInfo.jobStatus)}
              </div>
            </div>
            {
              (jobInfo?.jobStatus?.jobType !== "LAUNCHER" &&
              jobInfo?.jobStatus?.jobType !== "JOBWRAPPER") &&
              <div className={c(t.flex)}>
                <div className={t.ml5}>
                  <div className={c(t.gray, FontClassNames.medium, t.nowrap, t.lhTitle)}>Allocated/<br />Pending Containers</div>
                  <div className={c(FontClassNames.medium)} style={{ marginTop: 2 }}>
                    {jobInfo.jobStatus.runningContianers + '/' + jobInfo.jobStatus.pendingContaines}
                  </div>
                </div>
                <div className={t.ml5}>
                  <div className={c(t.gray, FontClassNames.medium, t.nowrap, t.lhTitle)}>Allocated/<br />UtilizedVirtual GB</div>
                  <div className={c(FontClassNames.medium)} style={{ marginTop: 2 }}>
                    {jobInfo.jobStatus.allocatedMB < 0 ? '0/0' : (jobInfo.jobStatus.allocatedMB / 1024).toFixed(2) + '/' + (jobInfo.jobStatus.utilizedMB / 1024).toFixed(2)}
                  </div>
                </div>
                <div className={t.ml5}>
                  <div className={c(t.gray, FontClassNames.medium, t.nowrap, t.lhTitle)}>Allocated/<br />Utilized VCores</div>
                  <div className={c(FontClassNames.medium)} style={{ marginTop: 2 }}>
                    {jobInfo.jobStatus.allocatedVCores < 0 ? '0/0' : jobInfo.jobStatus.allocatedVCores + '/' + jobInfo.jobStatus.utilizedVCores.toFixed(2)}
                  </div>
                </div>
              </div>
            }
            <div className={t.ml5}>
              <div className={c(t.gray, FontClassNames.medium)}>Retry</div>
              <div className={c(t.mt3, FontClassNames.medium)}>
                {retry}
              </div>
            </div>
            <div className={c(t.selfEnd, t.mlAuto)}>
              <span className={c(t.ml2)}>
                <DefaultButton
                  text='Stop'
                  onClick={onStopJob}
                  disabled={launcherHistoryInfo || !StoppableStatus.includes(getHumanizedJobStateString(jobInfo.jobStatus))}
                />
              </span>
            </div>
          </div>
          {/* summary-row-2.5 error info */}
          {hintMessage && (
            <div className={t.mt4}>
              {/* {hintMessage} */}
            </div>
          )}
          {/* summary-row-3 */}
          {jobInfo &&
            (jobInfo.jobStatus.jobType === "SPARK" ||
            jobInfo.jobStatus.jobType === "LIVY-SESSION" ||
            jobInfo.jobStatus.jobType === "LIVY-BATCH") &&
            <div className={c(t.flex, t.itemsCenter, t.mt3)}>
            <Link
              styles={{ root: [FontClassNames.mediumPlus] }}
              target="_self"
              href="#"
              disabled={isNil(jobInfo?.jobStatus?.appExitDiagnostics)}
              onClick={onShowExitDiagnostics}
            >
              View Exit Diagnostics
            </Link>
            <div className={c(t.bl, t.mh3, t.h1)}></div>
            <Link
              styles={{ root: [FontClassNames.mediumPlus] }}
              href={`/logView.html?appId=${jobInfo.jobStatus.appId}&jobType=launcherAM&subCluster=${subCluster}`}
              disabled={isNil(jobInfo?.jobStatus?.appExitDiagnostics)}
              onClick={(event) => {
                event.preventDefault();
                window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
              }}
            >
              AM Logs
            </Link>
            <div className={c(t.bl, t.mh3, t.h1)}></div>
            <Link
              styles={{ root: [FontClassNames.mediumPlus] }}
              href="#"
              onClick={onShowResourcePanel}
            >
              {resourceRelatedWarning && (
                <i
                  className="fa fa-exclamation-triangle"
                  style={{ color: "#FFA333", paddingRight: "8px" }}
                ></i>
              )}
              View Resource Request/Preemption Metrics
            </Link>
          </div>}
          {/* Monaco Editor Modal */}
            <MonacoPanel
              isOpen={!isNil(monacoProps)}
              onDismiss={onDismiss}
              title={modalTitle}
              monacoProps={monacoProps}
            />
            {}
            <ResourceInfoRelatedPanel
              isOpen={showResourcePanel}
              onDismiss={onCloseResourcePanel}
              title={"test"}
              jobInfo={jobInfo}
              vcInfo={vcInfo}
              resourceRequests={resourceRequests}
              resourceRelatedWarning={resourceRelatedWarning}
            />
           {/* summary-row-4 */}
          {/* Timer */}
          <Timer interval={autoReloadInterval === 0 ? null : autoReloadInterval} func={onReload} />
        </Card>
      </div>
    );
  }
}

Summary.contextType = Context;

Summary.propTypes = {
  className: PropTypes.string,
  jobInfo: PropTypes.object.isRequired,
  reloading: PropTypes.bool.isRequired,
  onStopJob: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
};
