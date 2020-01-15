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

import {
  FontClassNames,
  FontWeights,
  FontSizes,
  ColorClassNames,
  IconFontSizes,
} from '@uifabric/styling';
import c from 'classnames';
import { get, isEmpty, isNil } from 'lodash';
import { DateTime } from 'luxon';
import {
  ActionButton,
  Dropdown,
  Link,
  MessageBar,
  MessageBarType,
  TooltipHost,
  DirectionalHint,
  Icon,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';

import t from '../../components/tachyons.scss';

import Card from './card';
import Timer from './timer';
import {
  printDateTime,
  isJobV2,
  HISTORY_API_ERROR_MESSAGE,
  HISTORY_DISABLE_MESSAGE,
} from '../utils/utils';
import MonacoPanel from '../../components/monaco-panel';
import StatusBadge from '../../components/status-badge';
import {
  getJobDuration,
  getDurationString,
  getHumanizedJobStateString,
} from '../utils/job';
import CopyButton from '../../components/copy-button';

const HintItem = ({ header, children }) => (
  <div className={c(t.flex, t.justifyStart)}>
    <div
      style={{
        width: '160px',
        minWidth: '160px',
        fontWeight: FontWeights.semibold,
      }}
    >
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
      monacoProps: null,
      modalTitle: '',
      autoReloadInterval: 10 * 1000,
      hideDialog: true,
      isRetryHealthy: false,
      hidePublishDialog: true,
    };

    this.onChangeInterval = this.onChangeInterval.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.showExitDiagnostics = this.showExitDiagnostics.bind(this);
    this.showEditor = this.showEditor.bind(this);
    this.showJobConfig = this.showJobConfig.bind(this);
    this.showStopJobConfirm = this.showStopJobConfirm.bind(this);
    this.setHideDialog = this.setHideDialog.bind(this);
    this.checkRetryHealthy = this.checkRetryHealthy.bind(this);
    this.checkRetryLink = this.checkRetryLink.bind(this);
    this.setHidePublishDialog = this.setHidePublishDialog.bind(this);
    this.showPublishDialog = this.showPublishDialog.bind(this);
  }

  async componentDidMount() {
    if (await this.checkRetryHealthy()) {
      this.setState({ isRetryHealthy: true });
    } else {
      this.setState({ isRetryHealthy: false });
    }
  }

  onChangeInterval(e, item) {
    this.setState({ autoReloadInterval: item.key });
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

  showStopJobConfirm() {
    this.setState({ hideDialog: false });
  }

  setHideDialog() {
    this.setState({ hideDialog: true });
  }

  showPublishDialog() {
    this.setState({ hidePublishDialog: false });
  }

  setHidePublishDialog() {
    this.setState({ hidePublishDialog: true });
  }

  showExitDiagnostics() {
    const { jobInfo } = this.props;
    const result = [];
    // trigger info
    result.push('[Exit Trigger Info]');
    result.push('');
    result.push(
      `ExitTriggerMessage: ${get(jobInfo, 'jobStatus.appExitTriggerMessage')}`,
    );
    result.push(
      `ExitTriggerTaskRole: ${get(
        jobInfo,
        'jobStatus.appExitTriggerTaskRoleName',
      )}`,
    );
    result.push(
      `ExitTriggerTaskIndex: ${get(
        jobInfo,
        'jobStatus.appExitTriggerTaskIndex',
      )}`,
    );
    const userExitCode = get(
      jobInfo,
      'jobStatus.appExitMessages.runtime.originalUserExitCode',
    );
    if (userExitCode) {
      // user exit code
      result.push(`UserExitCode: ${userExitCode}`);
    }
    result.push('');

    // exit spec
    const spec = jobInfo.jobStatus.appExitSpec;
    if (spec) {
      // divider
      result.push(Array.from({ length: 80 }, () => '-').join(''));
      result.push('');
      // content
      result.push('[Exit Spec]');
      result.push('');
      result.push(yaml.safeDump(spec));
      result.push('');
    }

    // diagnostics
    const diag = jobInfo.jobStatus.appExitDiagnostics;
    if (diag) {
      // divider
      result.push(Array.from({ length: 80 }, () => '-').join(''));
      result.push('');
      // content
      result.push('[Exit Diagnostics]');
      result.push('');
      result.push(diag);
      result.push('');
    }

    this.showEditor('Exit Diagnostics', {
      language: 'text',
      value: result.join('\n'),
    });
  }

  showJobConfig() {
    const { rawJobConfig } = this.props;
    if (isJobV2(rawJobConfig)) {
      this.showEditor('Job Config', {
        language: 'yaml',
        value: yaml.safeDump(rawJobConfig),
      });
    } else {
      this.showEditor('Job Config', {
        language: 'json',
        value: JSON.stringify(rawJobConfig, null, 2),
      });
    }
  }

  getUserFailureHintItems(jobInfo) {
    const result = [];
    const runtimeOutput = get(jobInfo, 'jobStatus.appExitMessages.runtime');
    // reason
    const reason = [];
    // static reason
    const spec = get(jobInfo, 'jobStatus.appExitSpec');
    if (spec && spec.reason) {
      reason.push(<div key='spec-reason'>{spec.reason}</div>);
    }
    // dynamic reason
    if (runtimeOutput && runtimeOutput.reason) {
      reason.push(<div key='runtime-reason'>{runtimeOutput.reason}</div>);
    } else {
      const launcherOutput = get(jobInfo, 'jobStatus.appExitMessages.launcher');
      if (launcherOutput) {
        reason.push(<div key='launcher-reason'>{launcherOutput}</div>);
      }
    }
    if (!isEmpty(reason)) {
      result.push(
        <HintItem key='reason' header='Exit Reason:'>
          {reason}
        </HintItem>,
      );
    }
    // solution
    const solution = [];
    if (runtimeOutput && runtimeOutput.solution) {
      solution.push(<li key='runtime-solution'>{runtimeOutput.solution}</li>);
    }
    if (spec && spec.solution) {
      solution.push(
        ...spec.solution.map((x, i) => <li key={`spec-reason-${i}`}>{x}</li>),
      );
    }
    if (!isEmpty(solution)) {
      result.push(
        <HintItem key='solution' header='Exit Solutions:'>
          <ul className={c(t.pa0, t.ma0)} style={{ listStyle: 'inside' }}>
            {solution}
          </ul>
        </HintItem>,
      );
    }

    return result;
  }

  async checkRetryHealthy() {
    const { launcherType } = this.props;
    if (launcherType !== 'k8s') {
      return false;
    }

    const { currentJob } = this.props;
    const { name, namespace, username } = currentJob;
    if (!(await this.checkAttemptAPI(namespace || username, name))) {
      return false;
    }
    return true;
  }

  renderHintMessage() {
    const { jobInfo } = this.props;
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
      result.push(
        <HintItem key='platform-exit-code' header='Exit Code:'>
          {code}
        </HintItem>,
      );
      // type
      if (type) {
        result.push(
          <HintItem key='type' header='Exit Type:'>
            {type}
          </HintItem>,
        );
      }
      if (type === 'USER_FAILURE' || type === 'UNKNOWN_FAILURE') {
        result.push(...this.getUserFailureHintItems(jobInfo));
      } else {
        result.push(
          <HintItem key='solution' header='Exit Solutions:'>
            Please send the{' '}
            <Link onClick={this.showExitDiagnostics}>exit diagnostics</Link> to
            your administrator for further investigation.
          </HintItem>,
        );
      }

      return (
        <MessageBar messageBarType={MessageBarType.error}>
          <div>{result}</div>
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
                  Please adjust the resource requirement in your{' '}
                  <Link onClick={this.showJobConfig}>job config</Link>, or wait
                  till other jobs release more resources back to the system.
                </div>
              </HintItem>
            </div>
          </MessageBar>
        );
      }
    }
  }

  checkRetryLink() {
    const { jobInfo, jobHistory } = this.props;
    const { isRetryHealthy } = this.state;

    if (
      jobHistory !== 'true' ||
      !isRetryHealthy ||
      isNil(jobInfo.jobStatus.retries) ||
      jobInfo.jobStatus.retries === 0
    ) {
      return false;
    } else {
      return true;
    }
  }

  getJobMetricsUrl(jobInfo, userName, jobName) {
    const { grafanaUri } = this.props;
    const from = jobInfo.jobStatus.createdTime;
    let to = '';
    const { state } = jobInfo.jobStatus;
    if (state === 'RUNNING') {
      to = Date.now();
    } else {
      to = jobInfo.jobStatus.completedTime;
    }
    return `${grafanaUri}/dashboard/db/joblevelmetrics?var-job=${
      userName ? `${userName}~${jobName}` : jobName
    }&from=${from}&to=${to}`;
  }

  async checkAttemptAPI(userName, jobName) {
    const { api } = this.props;
    const healthEndpoint = `${api}/api/v2/jobs/${userName}~${jobName}/job-attempts/healthz`;
    const healthRes = await fetch(healthEndpoint);
    if (healthRes.status !== 200) {
      return false;
    } else {
      return true;
    }
  }
  
  getTensorBoardUrl(jobInfo, rawJobConfig) {
    let port = null;
    let ip = null;
    if (rawJobConfig.extras && rawJobConfig.extras.tensorBoard) {
      const randomStr = rawJobConfig.extras.tensorBoard.randomStr;
      const tensorBoardPortStr = `tensorBoardPort_${randomStr}`;
      const taskRoles = jobInfo.taskRoles;
      Object.keys(taskRoles).forEach(taskRoleKey => {
        const taskStatuses = taskRoles[taskRoleKey].taskStatuses[0];
        if (
          taskStatuses.taskState === 'RUNNING' &&
          taskStatuses.containerPorts &&
          !isNil(taskStatuses.containerPorts[tensorBoardPortStr])
        ) {
          port = taskStatuses.containerPorts[tensorBoardPortStr];
          ip = taskStatuses.containerIp;
        }
      });
    }
    if (isNil(port) || isNil(ip)) {
      return null;
    }
    return `http://${ip}:${port}`;
  }

  render() {
    const {
      autoReloadInterval,
      modalTitle,
      monacoProps,
      isRetryHealthy,
    } = this.state;
    const { className, jobInfo, reloading, onReload, launcherType, jobHistory } = this.props;
    const { rawJobConfig } = this.props;
    const hintMessage = this.renderHintMessage();

    const params = new URLSearchParams(window.location.search);
    const namespace = params.get('username');
    const jobName = params.get('jobName');

    return (
      <div className={className}>
        {/* summary */}
        <Card className={c(t.pv4, t.ph5)}>
          {/* summary-row-1 */}
          <div className={c(t.flex, t.justifyBetween, t.itemsCenter)}>
            <div
              className={c(t.flex, t.itemsCenter)}
              style={{ flexShrink: 1, minWidth: 0 }}
            >
              <div
                className={c(t.truncate)}
                style={{
                  fontSize: FontSizes.xxLarge,
                  fontWeight: FontWeights.regular,
                }}
              >
                {jobInfo.name}
              </div>
              {jobInfo.debugId && (
                <div className={t.ml2}>
                  <TooltipHost
                    calloutProps={{
                      isBeakVisible: false,
                    }}
                    delay={0}
                    tooltipProps={{
                      onRenderContent: () => (
                        <div
                          className={c(t.flex, t.itemsCenter)}
                          style={{ maxWidth: 300 }}
                        >
                          <div>debugID:</div>
                          <div className={c(t.ml2, t.truncate)}>
                            {jobInfo.debugId}
                          </div>
                          <CopyButton value={jobInfo.debugId} />
                        </div>
                      ),
                    }}
                    directionalHint={DirectionalHint.topCenter}
                  >
                    <div>
                      <Icon
                        iconName='Info'
                        styles={{
                          root: [
                            { fontSize: IconFontSizes.medium },
                            ColorClassNames.neutralSecondary,
                          ],
                        }}
                      />
                    </div>
                  </TooltipHost>
                </div>
              )}
            </div>
            <div className={c(t.flex, t.itemsCenter)}>
              <Dropdown
                styles={{
                  title: [FontClassNames.mediumPlus, { border: 0 }],
                }}
                dropdownWidth={180}
                selectedKey={autoReloadInterval}
                onChange={this.onChangeInterval}
                options={[
                  { key: 0, text: 'Disable Auto Refresh' },
                  { key: 10000, text: 'Refresh every 10s' },
                  { key: 30000, text: 'Refresh every 30s' },
                  { key: 60000, text: 'Refresh every 60s' },
                ]}
              />
              <ActionButton
                className={t.ml2}
                styles={{ root: [FontClassNames.mediumPlus] }}
                iconProps={{ iconName: 'Refresh' }}
                disabled={reloading}
                onClick={onReload}
              >
                Refresh
              </ActionButton>
            </div>
          </div>
          {/* summary-row-2 */}
          <div className={c(t.mt4, t.flex, t.itemsStart)}>
            <div>
              <div className={c(t.gray, FontClassNames.medium)}>Status</div>
              <div className={c(t.mt3)}>
                <StatusBadge
                  status={getHumanizedJobStateString(jobInfo.jobStatus)}
                />
              </div>
            </div>
            <div className={t.ml4}>
              <div className={c(t.gray, FontClassNames.medium)}>Start Time</div>
              <div className={c(t.mt3, FontClassNames.mediumPlus)}>
                {printDateTime(
                  DateTime.fromMillis(jobInfo.jobStatus.createdTime),
                )}
              </div>
            </div>
            <div className={t.ml4}>
              <div className={c(t.gray, FontClassNames.medium)}>User</div>
              <div className={c(t.mt3, FontClassNames.mediumPlus)}>
                {jobInfo.jobStatus.username}
              </div>
            </div>
            <div className={t.ml4}>
              <div className={c(t.gray, FontClassNames.medium)}>
                Virtual Cluster
              </div>
              <div className={c(t.mt3, FontClassNames.mediumPlus)}>
                {jobInfo.jobStatus.virtualCluster}
              </div>
            </div>
            <div className={t.ml4}>
              <div className={c(t.gray, FontClassNames.medium)}>Duration</div>
              <div className={c(t.mt3, FontClassNames.mediumPlus)}>
                {getDurationString(getJobDuration(jobInfo.jobStatus))}
              </div>
            </div>
            <div className={t.ml4}>
              <div className={c(t.gray, FontClassNames.medium)}>Retries</div>
              {this.checkRetryLink() ? (
                <Link
                  href={`job-retry.html?username=${namespace}&jobName=${jobName}`}
                >
                  <div className={c(t.mt3, FontClassNames.mediumPlus)}>
                    {jobInfo.jobStatus.retries}
                  </div>
                </Link>
              ) : (
                <div className={c(t.mt3, FontClassNames.mediumPlus)}>
                  {jobInfo.jobStatus.retries}
                </div>
              )}
            </div>
          </div>
          {/* summary-row-2.5 error info */}
          {hintMessage && <div className={t.mt4}>{hintMessage}</div>}
          {/* summary-row-3 */}
          <div className={c(t.mt4, t.flex, t.justifyBetween, t.itemsCenter)}>
            <div className={c(t.flex)}>
              <Link
                styles={{ root: [FontClassNames.mediumPlus] }}
                href='#'
                disabled={isNil(rawJobConfig)}
                onClick={this.showJobConfig}
              >
                View Job Config
              </Link>
              <div className={c(t.bl, t.mh3)}></div>
              <Link
                styles={{ root: [FontClassNames.mediumPlus] }}
                href='#'
                disabled={
                  isNil(jobInfo.jobStatus.appExitDiagnostics) &&
                  isNil(jobInfo.jobStatus.appExitSpec)
                }
                onClick={this.showExitDiagnostics}
              >
                View Exit Diagnostics
              </Link>
              {launcherType !== 'k8s' && (
                <React.Fragment>
                  <div className={c(t.bl, t.mh3)}></div>
                  <Link
                    styles={{ root: [FontClassNames.mediumPlus] }}
                    href={jobInfo.jobStatus.appTrackingUrl}
                    disabled={isNil(jobInfo.jobStatus.appTrackingUrl)}
                    target='_blank'
                  >
                    Go to Application Tracking Page
                  </Link>
                </React.Fragment>
              )}
              <div className={c(t.bl, t.mh3)}></div>
              <Link
                styles={{ root: [FontClassNames.mediumPlus] }}
                href={this.getJobMetricsUrl(jobInfo)}
                target='_blank'
              >
                Go to Job Metrics Page
              </Link>
              <div className={c(t.bl, t.mh3)}></div>
              <Link
                styles={{ root: [FontClassNames.mediumPlus] }}
                href={this.getTensorBoardUrl(jobInfo, rawJobConfig)}
                disabled={isNil(this.getTensorBoardUrl(jobInfo, rawJobConfig))}
                target='_blank'
              >
                Go to TensorBoard Page
              </Link>
              <div className={c(t.bl, t.mh3)}></div>
              <div className={c(t.flex)}>
                <Link
                  styles={{ root: [FontClassNames.mediumPlus] }}
                  href={`job-retry.html?username=${namespace}&jobName=${jobName}`}
                  disabled={!this.checkRetryLink()}
                  target='_blank'
                >
                  Go to Retry History Page
                </Link>
                {jobHistory !== 'true' && (
                  <div className={t.ml2}>
                    <TooltipHost
                      calloutProps={{
                        isBeakVisible: false,
                      }}
                      tooltipProps={{
                        onRenderContent: () => (
                          <div className={c(t.flex, t.itemsCenter)}>
                            {HISTORY_DISABLE_MESSAGE}
                          </div>
                        ),
                      }}
                      directionalHint={DirectionalHint.topLeftEdge}
                    >
                      <div>
                        <Icon
                          iconName='Info'
                          styles={{
                            root: [
                              { fontSize: IconFontSizes.medium },
                              ColorClassNames.neutralSecondary,
                            ],
                          }}
                        />
                      </div>
                    </TooltipHost>
                  </div>
                )}
                {jobHistory === 'true' && !isRetryHealthy && (
                  <div className={t.ml2}>
                    <TooltipHost
                      calloutProps={{
                        isBeakVisible: false,
                      }}
                      tooltipProps={{
                        onRenderContent: () => (
                          <div className={c(t.flex, t.itemsCenter)}>
                            {HISTORY_API_ERROR_MESSAGE}
                          </div>
                        ),
                      }}
                      directionalHint={DirectionalHint.topLeftEdge}
                    >
                      <div>
                        <Icon
                          iconName='Warning'
                          styles={{
                            root: [
                              { fontSize: IconFontSizes.medium },
                              ColorClassNames.neutralSecondary,
                            ],
                          }}
                        />
                      </div>
                    </TooltipHost>
                  </div>
                )}
              </div>
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
          <Timer
            interval={autoReloadInterval === 0 ? null : autoReloadInterval}
            func={onReload}
          />
        </Card>
      </div>
    );
  }
}

Summary.propTypes = {
  className: PropTypes.string,
  jobInfo: PropTypes.object.isRequired,
  reloading: PropTypes.bool.isRequired,
  onReload: PropTypes.func.isRequired,
  currentJob: PropTypes.object.isRequired,
  rawJobConfig: PropTypes.object.isRequired,
  api: PropTypes.string.isRequired,
  grafanaUri: PropTypes.string.isRequired,
  launcherType: PropTypes.string.isRequired,
  jobHistory: PropTypes.string.isRequired,
};
