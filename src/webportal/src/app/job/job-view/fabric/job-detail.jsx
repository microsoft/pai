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

import "core-js/stable";
import "regenerator-runtime/runtime";
import "whatwg-fetch";

import classNames from "classnames";
import { get, isEmpty, isNil } from "lodash";
import {
  initializeIcons,
  FontClassNames,
  MessageBar,
  MessageBarType,
  getTheme,
} from "office-ui-fabric-react";
import React from "react";

import t from "../../../components/tachyons.scss";
import "../../../spark-debugging/spark-debugging.css";

import Context from "./job-detail/components/context";
import Top from "./job-detail/components/top";
import Summary from "./job-detail/components/summary";
import { SpinnerLoading } from "../../../components/loading";
import TaskRole from "./job-detail/components/task-role";
import {getResourceRequests} from './job-detail/conn';

import {
  fetchJobInfo,
  stopJob,
  stopAllJobs,
  NotFoundError,
  fetchJobFullDetail,
  getJobGroupApplication,
  fetchVCInfo,
  fetchFrameworkAttempts,
  fetchFrameworkAttempt,
  fetchFrameworkVersions,
} from "./job-detail/conn";
import { getHumanizedJobStateString } from "../../../components/util/job";
import SparkDebugging from "../../../spark-debugging/spark-debugging";
import { shouldWarnResourceIssues } from "./job-detail/util";
import c from "classnames";
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot";
import { ComboBox } from "office-ui-fabric-react";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";
import Task from "./job-detail/components/Task";
import { renderWithErrorBoundary } from '../../../components/error-boundary';


initializeIcons();

class JobDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      reloading: false,
      error: null,
      // always reload
      jobInfo: null,
      jobGroupApplication: null,
      // load once
      rawJobConfig: null,
      jobConfig: null,
      sshInfo: null,
      jobFullDetail: null,
      jobAddressOnSHS: null,
      vcInfo: null,
      resourceRelatedWarning: false,
      localStorageKeys: null,
      attemptItems: [],
      attemptItemsFetchStatus: "UNFETCHED",
      versionItems: [],
      versionItemsFetched: false,
      monacoProps: null,
      modalTitle: '',
      autoReloadInterval: 0,
      showPanel: false,
      showResourcePanel: false,
      resourceRequests: null,
    };
    this.stop = this.stop.bind(this);
    this.stopAll = this.stopAll.bind(this);
    this.reload = this.reload.bind(this);
    this.setCurJobInfo = this.setCurJobInfo.bind(this);
    this.reloadFrameworkAttempt = this.reloadFrameworkAttempt.bind(this);
    this.reloadFrameworkAttempts = this.reloadFrameworkAttempts.bind(this);
    this.reloadFrameworkVersions = this.reloadFrameworkVersions.bind(this);
    this.reloadFrameworkVersion = this.reloadFrameworkVersion.bind(this);
    this.onShowExitDiagnostics = this.onShowExitDiagnostics.bind(this);
    this.onCloseResourcePanel = this.onCloseResourcePanel.bind(this);
    this.onShowResourcePanel = this.onShowResourcePanel.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.showPanel = this.showPanel.bind(this);
    this.closePanel = this.closePanel.bind(this);
    this.showEditor = this.showEditor.bind(this);
    this.showJobConfig = this.showJobConfig.bind(this);
  }

  componentDidMount() {
    void this.reload(true);
  }

  async reload(alertFlag) {
    this.setState({
      reloading: true,
    });
    const params = new URLSearchParams(window.location.search);
    const { rawJobConfig, jobConfig, sshInfo } = this.state;
    const nextState = {
      loading: false,
      reloading: false,
      error: null,
    };
    const loadJobInfo = async () => {
      try {
        nextState.jobInfo = await fetchJobInfo();
      } catch (err) {
        nextState.error = `Waiting for fetching job status: ${err.message}`;
      }
    };
    const loadJobFullDetail = async () => {
      try {
        nextState.jobFullDetail = await fetchJobFullDetail(
          nextState.jobInfo.jobStatus.moduleID ||
            nextState.jobInfo.jobStatus.name
        ); // TODO: Remove moduleID part. Only use name.
      } catch (err) {
        nextState.error = `fetch job full detail failed: ${err.message}`;
      }
    };

    const loadJobGroupApplication = async (groupId) => {
      try {
        nextState.jobGroupApplication = await getJobGroupApplication(groupId);
      } catch (err) {
        nextState.error = `fetch job app group failed: ${err.message}`;
      }
    };

    const loadVCInfo = async (jobInfo) => {
      try {
        nextState.vcInfo = await fetchVCInfo(jobInfo);
      } catch (err) {
        nextState.error = `failed to load vc info: ${err.message}`;
      }
    };

    await Promise.all([loadJobInfo()]);

    if (!isNil(nextState.jobInfo) && nextState.jobInfo.jobStatus.groupId) {
      await loadJobGroupApplication(nextState.jobInfo.jobStatus.groupId);
    } else if (!isEmpty(params.get("groupId"))) {
      await loadJobGroupApplication(params.get("groupId"));
    }

    if (
      !isNil(nextState.jobInfo) &&
      (nextState.jobInfo.jobStatus.jobType === "LAUNCHER" ||
        nextState.jobInfo.jobStatus.jobType === "JOBWRAPPER")
    ) {
      await loadJobFullDetail();
      if (!isNil(nextState.jobFullDetail.jobStatus)) {
        nextState.jobInfo.jobStatus.appTrackingUrl =
          nextState.jobFullDetail.jobStatus.appTrackingUrl;
        nextState.jobInfo.jobStatus.appExitDiagnostics =
          nextState.jobFullDetail.jobStatus.appExitDiagnostics;
      }
    }

    if (
      !isNil(nextState.jobInfo) &&
      (nextState.jobInfo.jobStatus.state === "RUNNING" ||
        nextState.jobInfo.jobStatus.state === "WAITING")
    ) {
      await loadVCInfo(nextState.jobInfo);
    }

    if (!isNil(nextState.jobInfo)) {
      nextState.resourceRelatedWarning = shouldWarnResourceIssues(
        nextState.jobInfo,
        nextState.vcInfo
      );
    }

    if (alertFlag === true && !isNil(nextState.error)) {
      setTimeout(function () {
        location = "";
      }, 30 * 1000);
    }

    if (
      !isNil(nextState.jobInfo) &&
      (nextState.jobInfo.jobStatus.jobType === "LAUNCHER" ||
      nextState.jobInfo.jobStatus.jobType === "JOBWRAPPER")
    ) {
      nextState.selectedVersion = nextState.jobInfo?.jobStatus?.version?.toString();
      const attemptItems = [];
      const attemptId = Number(nextState.jobInfo.jobStatus.attemptId);
      for (
        let index = attemptId - 100 < 0 ? 0 : attemptId - 100;
        index <= attemptId;
        index++
      ) {
        attemptItems.push({
          key: index,
          text: index.toString(),
        });
      }
      nextState.attemptItems = attemptItems;
      nextState.selectedAttemptId = attemptId.toString();
      nextState.curLauncherJobInfo = {
        completedTime: nextState.jobInfo.jobStatus.completedTime,
        jobCurrentState: {
          state: nextState.jobInfo.jobStatus.state,
          executionType: nextState.jobInfo.jobStatus.executionType,
        },
        version: Number(nextState.jobInfo.jobStatus.version),
        attemptId: Number(nextState.jobInfo.jobStatus.attemptId),
      };
    }

    this.setState(nextState);
  }

  async stop() {
    await stopJob();
    await this.reload();
  }

  async stopAll() {
    const params = new URLSearchParams(window.location.search);
    const groupId = this.state.jobInfo.jobStatus.groupId || params.get('groupId');
    await stopAllJobs(groupId);
    await this.reload();
  }

  setCurJobInfo(jobDetailLink) {
    window.location.href = `./${jobDetailLink}`;
  }

  getMessageInfoDiv(msg) {
    return (
      <div className={c(t.sansSerif, t.relative)}>
        {/* pivot-bottom-border */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            top: "38px",
            left: "0px",
            borderBottom: "2px solid #222D32",
          }}
        ></div>
        {/* attemptId combobox */}
        <Pivot>
          <PivotItem
            className={c(t.pl0)}
            headerText="Information"
            itemKey="Information"
          >
            <div className={c(t.mt4, t.f5)}>{msg}</div>
          </PivotItem>
        </Pivot>
      </div>
    );
  }

  onShowResourcePanel() {
    const {jobInfo} = this.state;
    getResourceRequests(jobInfo.jobStatus.appId)
      .then((data) => {
        this.setState( {resourceRequests: data.resourceRequests} );
        this.setState( {showResourcePanel: true} );
      })
      .catch((err) => {
        alert(`Failed to load application resourceRequest information! ${err.toString()}`);
        this.setState( {showResourcePanel: false} );
      });
  };

  onShowExitDiagnostics() {
    const {jobInfo} = this.state;
    const result = [];
    // trigger info
    result.push("[Exit Trigger Info]");
    result.push("");
    result.push(
      `ExitTriggerMessage: ${get(jobInfo, "jobStatus.appExitTriggerMessage")}`
    );
    result.push(
      `ExitTriggerTaskRole: ${get(
        jobInfo,
        "jobStatus.appExitTriggerTaskRoleName"
      )}`
    );
    result.push(
      `ExitTriggerTaskIndex: ${get(
        jobInfo,
        "jobStatus.appExitTriggerTaskIndex"
      )}`
    );
    const userExitCode = get(
      jobInfo,
      "jobStatus.appExitMessages.runtime.originalUserExitCode"
    );
    if (userExitCode) {
      // user exit code
      result.push(`UserExitCode: ${userExitCode}`);
    }
    result.push("");
    // exit spec
    const spec = jobInfo.jobStatus.appExitSpec;
    if (spec) {
      // divider
      result.push(Array.from({ length: 80 }, () => "-").join(""));
      result.push("");
      // content
      result.push("[Exit Spec]");
      result.push("");
      result.push(yaml.safeDump(spec));
      result.push("");
    }

    // diagnostics
    const diag = jobInfo.jobStatus.appExitDiagnostics;
    if (diag) {
      // divider
      result.push(Array.from({ length: 80 }, () => "-").join(""));
      result.push("");
      // content
      result.push("[Exit Diagnostics]");
      result.push("");
      result.push(diag);
      result.push("");
    }

    this.showEditor("Exit Diagnostics", {
      language: "text",
      value: result.join("\n"),
    });
  };

  onCloseResourcePanel() {
    this.setState( {showResourcePanel: false} );
  };

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

  showPanel() {
    this.setState( {showPanel: true } );
  }
  
  closePanel() {
    this.setState( {showPanel: false } );
  }

  showJobConfig() {
    const {rawJobConfig} = this.context;
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

  renderTaskRoles() {
    const { jobConfig, jobFullDetail, jobInfo, selectedAttemptId, selectedVersion, attemptItemsFetchStatus, attemptItems, resourceRelatedWarning } = this.state;
    const jobName = jobFullDetail?.jobStatus?.name;
    const taskinfos = {
      info: {
        jobInfo,
        jobFullDetail,
        jobName,
        attemptItems,
        selectedAttemptId,
        selectedVersion,
        resourceRelatedWarning,
        onShowResourcePanel: this.onShowResourcePanel,
        onCloseResourcePanel: this.onCloseResourcePanel,
        onShowExitDiagnostics: this.onShowExitDiagnostics,
        attemptItemsFetchStatus,
        setJobDetailState: this.setState.bind(this),
        reloadAttempts: this.reloadFrameworkAttempts,
      }
    };

    if (jobFullDetail && !isEmpty(jobFullDetail.taskRoles)) {
      const failedTaskRole =
        getHumanizedJobStateString(jobFullDetail.jobStatus) === "Failed" &&
        get(jobFullDetail, "jobStatus.appExitTriggerTaskRoleName");
      return (
        <Task {...taskinfos}>
          {Object.keys(jobFullDetail.taskRoles).map((name) => (
            <TaskRole
              key={name}
              className={t.mt1}
              name={name}
              taskInfo={jobFullDetail.taskRoles[name]}
              jobName={jobName}
              appId={jobInfo.jobStatus.appId}
              jobStatus={getHumanizedJobStateString(jobInfo.jobStatus)}
              isFailed={failedTaskRole && name === failedTaskRole}
          />
        ))}
      </Task>
      );
    } else if (jobConfig && jobConfig.taskRoles) {
      return (
        <Task {...taskinfos}>
          {Object.entries(jobConfig.taskRoles).map(([name, taskConfig]) => {
            // dummy tasks
            let dummyTaskInfo = null;
            if (taskConfig && taskConfig.instances) {
              dummyTaskInfo = {
                taskStatuses: Array.from(
                  { length: taskConfig.instances },
                  (v, idx) => ({
                    taskState: "Waiting",
                  })
                ),
              };
            }
            return (
              <TaskRole
                key={name}
                name={name}
                className={t.mt3}
                taskInfo={dummyTaskInfo}
                jobName={jobName}
                appId={jobInfo.jobStatus.appId}
                jobStatus={getHumanizedJobStateString(jobInfo.jobStatus)}
              />
            );
          })}
        </Task>
      );
      
      
    } else {
      if (
        jobFullDetail &&
        isEmpty(jobFullDetail.taskRoles) &&
        getHumanizedJobStateString(jobFullDetail.jobStatus) === "Failed"
      ) {
        return this.getMessageInfoDiv(
          'Failed to start AM Container. More details please click "View Exit Diagnostics".'
        );
      }
      return (
        <Task {...taskinfos}>
          {undefined}
        </Task>
      );
    }
  }

  renderSparkJobDetail() {
    const { jobInfo } = this.state;
    if (jobInfo) {
      const appInfo = {
        datacenter: jobInfo.jobStatus.runningDataCenter,
        appId: jobInfo.jobStatus.appId,
        attemptId: jobInfo.jobStatus.latestAttemptId,
        jobStatus: getHumanizedJobStateString(jobInfo.jobStatus),
        appTrackingUrl: jobInfo.jobStatus.appTrackingUrl,
        appExitDiagnostics: jobInfo.jobStatus.appExitDiagnostics,
        amContainerLogs: jobInfo.jobStatus.amContainerLogs,
      };
      return <SparkDebugging appInfo={appInfo} />;
    } else {
      return null;
    }
  }

  async reloadFrameworkAttempt() {
    const {
      jobInfo,
      selectedVersion,
      selectedAttemptId,
      curLauncherJobInfo,
    } = this.state;
    this.setState({
      loading: true,
    });
    const nextState = {};
    nextState.loading = false;
    try {
      const attemptInfo = await fetchFrameworkAttempt(
        jobInfo.jobStatus.name,
        selectedVersion,
        selectedAttemptId,
      );
      nextState.jobInfo = attemptInfo.frameworkInfo;
      nextState.jobFullDetail = attemptInfo.frameworkFullDetail;
      nextState.jobInfo.jobStatus.completedTime
        = nextState.jobFullDetail.jobStatus.completedTime
        = curLauncherJobInfo.completedTime;
      nextState.jobInfo.jobStatus.appTrackingUrl =
        nextState.jobFullDetail.jobStatus.appTrackingUrl;
      nextState.jobInfo.jobStatus.appExitDiagnostics =
        nextState.jobFullDetail.jobStatus.appExitDiagnostics;
      nextState.launcherHistoryInfo =
        Number(nextState.jobInfo.jobStatus.attemptId) !==
          curLauncherJobInfo.attemptId ||
        Number(nextState.jobInfo.jobStatus.version) !==
          curLauncherJobInfo.version;
      const { attemptItems } = this.state;
      nextState.jobInfo.jobStatus.retries =
        attemptItems[attemptItems.length - 1].key;
      nextState.jobFullDetail.jobStatus.executionType
        = nextState.jobInfo.jobStatus.executionType
        = curLauncherJobInfo.jobCurrentState.executionType;
      nextState.jobFullDetail.jobStatus.state
        = nextState.jobInfo.jobStatus.state
        = curLauncherJobInfo.jobCurrentState.state;
    } catch (err) {
      if (err instanceof NotFoundError) {
        nextState.error = `wrong attempt: ${err.message}`;
      } else {
        nextState.error = `failed to fetch attempt: ${err.message}`;
      }
    }
    this.setState(nextState);
  }

  async reloadFrameworkVersion() {
    this.setState({
      loading: true,
    });
    this.reloadFrameworkAttempts().then(() => {
      const { attemptItems } = this.state;
      if (attemptItems.length === 0) {
        this.setState({
          loading: false,
          error: `Wrong version or this version was not backed up successfully`,
        });
      } else {
        const { curLauncherJobInfo } = this.state;
        this.setState({
          selectedAttemptId: attemptItems[attemptItems.length - 1].text,
          curLauncherJobInfo,
        });
      }
    });
  }

  async reloadFrameworkAttempts() {
    const { jobInfo, selectedVersion } = this.state;
    const nextState = {
      attemptItemsFetchStatus: "FETCHING",
    };
    this.setState(nextState);
    try {
      const attempts = await fetchFrameworkAttempts(
        jobInfo.jobStatus.name,
        selectedVersion
      );
      const attemptItems = attempts.map((e) => {
        return {
          key: Number(e),
          text: e.toString(),
        };
      });
      nextState.attemptItems = attemptItems;
      nextState.attemptItemsFetchStatus = "FETCHED";
    } catch (err) {
      nextState.attemptItemsFetchStatus = "UNFETCHED";
      if (err instanceof NotFoundError) {
        nextState.error = `wrong version: ${err.message}`;
      } else {
        nextState.error = `failed to fetch attempt list: ${err.message}`;
      }
    }
    this.setState(nextState);
  }

  async reloadFrameworkVersions() {
    const { jobInfo } = this.state;
    const nextState = {
      versionItemsFetched: true,
    };
    this.setState(nextState);
    try {
      const versions = await fetchFrameworkVersions(jobInfo.jobStatus.name);
      const versionItems = versions.map((e) => {
        return {
          key: Number(e),
          text: e.toString(),
        };
      });
      nextState.versionItems = versionItems;
    } catch (err) {
      nextState.versionItemsFetched = false;
      nextState.error = `failed to fetch version list: ${err.message}`;
    }
    this.setState(nextState);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !isNil(prevState.jobInfo) &&
      (prevState.jobInfo.jobStatus.jobType === "LAUNCHER" ||
      prevState.jobInfo.jobStatus.jobType === "JOBWRAPPER")
    ) {
      if (prevState.selectedVersion !== this.state.selectedVersion) {
        this.reloadFrameworkVersion();
      }
      if (
        !isNil(this.state.selectedAttemptId) &&
        prevState.selectedAttemptId !== this.state.selectedAttemptId
      ) {
        this.reloadFrameworkAttempt();
      }
    }
  }

  render() {
    const {
      jobFullDetail,
      loading,
      reloading,
      error,
      jobInfo,
      jobGroupApplication,
      vcInfo,
      resourceRelatedWarning,
      jobConfig,
      rawJobConfig,
      sshInfo,
      launcherHistoryInfo,
      selectedVersion,
      versionItems,
      versionItemsFetched,
      modalTitle, 
      monacoProps, 
      showResourcePanel, 
      resourceRequests,
    } = this.state;
    if (loading) {
      return <SpinnerLoading />;
    } else {
      return (
        <Context.Provider
          value={{ sshInfo, rawJobConfig, jobConfig, launcherHistoryInfo }}
        >
          <div className={classNames(t.w100, t.pa4, FontClassNames.medium)}>
            <Top
              jobInfo={jobInfo ? jobInfo : {}}
              jobGroupApplication={
                jobGroupApplication ? jobGroupApplication.apps : []
              }
              setCurJobInfo={this.setCurJobInfo}
              onStopAllJob={this.stopAll}
            />
            {!isEmpty(error) && (
              <div className={t.bgWhite}>
                <MessageBar messageBarType={MessageBarType.warning}>
                  {error}
                </MessageBar>
              </div>
            )}

            {isEmpty(error) && jobInfo && (
              <div>
                <Summary
                  className={t.mt3}
                  vcInfo={vcInfo}
                  jobInfo={jobInfo}
                  reloading={reloading}
                  onStopJob={this.stop}
                  onReload={this.reload}
                  modalTitle={modalTitle}
                  monacoProps={monacoProps} 
                  showResourcePanel={showResourcePanel}
                  resourceRequests={resourceRequests}
                  selectedVersion= {selectedVersion}
                  versionItems={versionItems}
                  versionItemsFetched={versionItemsFetched}
                  resourceRelatedWarning={resourceRelatedWarning}
                  onDismiss= {this.onDismiss}
                  onShowResourcePanel={this.onShowResourcePanel}
                  onCloseResourcePanel={this.onCloseResourcePanel}
                  onShowExitDiagnostics={this.onShowExitDiagnostics}
                  reloadVersions={this.reloadFrameworkVersions}
                  setJobDetailState={this.setState.bind(this)}
                />
                {/* <SpinnerLoading /> */}
                {jobInfo &&
                  (jobInfo.jobStatus.jobType === "LAUNCHER" ||
                    jobInfo.jobStatus.jobType === "JOBWRAPPER") &&
                  this.renderTaskRoles()}
                {jobInfo &&
                  (jobInfo.jobStatus.jobType === "SPARK" ||
                    jobInfo.jobStatus.jobType === "LIVY-SESSION" ||
                    jobInfo.jobStatus.jobType === "LIVY-BATCH") &&
                  this.renderSparkJobDetail()}
              </div>
            )}
          </div>
        </Context.Provider>
      );
    }
  }
}

renderWithErrorBoundary(<JobDetail />, document.getElementById("content-wrapper"));
