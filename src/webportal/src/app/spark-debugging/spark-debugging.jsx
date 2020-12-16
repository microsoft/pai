import "regenerator-runtime/runtime";
import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { initializeIcons } from "@uifabric/icons";
import { isNil, isEmpty } from "lodash";
import { ComboBox, Icon } from "office-ui-fabric-react/lib/index";
//import { FontIcon } from 'office-ui-fabric-react/lib/Icon';

import { Label } from "office-ui-fabric-react/lib/Label";
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot";
import JobGraph from "./components/jobgraph/job-graph";
import Vcore from "./components/vcore/vcore";
import Stages from "./components/stages/stages";
import Executors from "./components/executors/executors";
import Runtime from "./components/runtime/runtime";
import Diagnostics from "./components/diagnostics/diagnostics";
import ErrorInfos from "./components/errors/errors";
import Environment from "./components/environment/Environment";
import ExecutorDetail from "./components/exedetail/executor-detail";
import Streaming from "./streaming/streaming";
import AppData from "./components/common/appdata-context";
import { IndicatorLoading } from "./components/common/loading/loading";
import * as config from "../config/webportal.config.js";
import { handleDom } from "./components/common/table/utils";
import {
  ApplicationHelper,
  ApplicationInfo,
} from "./models/schema/application";
import {
  TabParameters,
  TabParameterHelper,
} from "./components/common/tab-parameters";
import "./icon-font/iconfont.css";
import './icon-font2/iconfont.css';
import './icon-font2/iconfont.js';
initializeIcons();

export default class SparkDebugging extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      loadingProgress: -1,
      loadingDataSize: 0,
      error: null,

      // always reload
      attemptId: this.props.appInfo.attemptId,
      appInfo: this.props.appInfo,

      // load once
      appData: null,
      applicationInfo: null,

      //control
      tabParameters: new TabParameters("jobgraph", -1, 0, 0, -1),
      prevTab: "jobgraph",
    };

    this.reload = this.reload.bind(this);
    this.loadAppData = this.loadAppData.bind(this);

    this.onChangeTab = this.onChangeTab.bind(this);
    this.onChangeJobCombobox = this.onChangeJobCombobox.bind(this);
    this.callbackChangeTab = this.callbackChangeTab.bind(this);
    this.updateLoadingProgress = this.updateLoadingProgress.bind(this);
    this.onRenderItemLink = this.onRenderItemLink.bind(this);
    this.getAttemptIdComboBoxItems = this.getAttemptIdComboBoxItems.bind(this);
    this.onChangeAttemptIdCombobox = this.onChangeAttemptIdCombobox.bind(this);
    this.onRenderCombobox = this.onRenderCombobox.bind(this);

    // Use helper to fetch data
    this.helper = new ApplicationHelper(props.appInfo);
    this.helper.setDownloadProgressHander(this.updateLoadingProgress);
  }

  updateLoadingProgress(props) {
    this.setState({
      loadingProgress: props.loadingProgress,
      loadingDataSize: props.loadingDataSize,
    });
  }

  callbackChangeTab(tab, jobId, stageId, exeId, attemptID) {
    let prevParameters = this.state.tabParameters;
    this.setState(
      {
        prevTab: prevParameters.tab,
        tabParameters: {
          tab: tab,
          jobId: jobId || jobId === 0 ? jobId : prevParameters.jobId,
          stageId: stageId || stageId === 0 ? stageId : prevParameters.stageId,
          exeId: exeId || exeId === 0 ? exeId : prevParameters.exeId,
          attemptID: attemptID || attemptID === 0 ? attemptID : prevParameters.attemptID,
        },
      },
      () => {
        TabParameterHelper.updateHashParameters(this.state.tabParameters);
        if (prevParameters.tab === "diagnostics") {
          this.state.appData.updateDiagResults();
        }
      }
    );
  }

  onChangeTab(event) {
    this.callbackChangeTab(event.props.itemKey, null, null, null, null);
  }

  onChangeJobCombobox(e, job) {
    let jobId = job.text.toLowerCase() === "all jobs" ? -1 : job.key;
    this.callbackChangeTab(this.state.tabParameters.tab, jobId, null, null, null);
  }

  async onChangeAttemptIdCombobox(e, attemptItem) {
    if (this.state.attemptId !== attemptItem.key) {
      this.callbackChangeTab("jobgraph", -1, 0, 0, -1);
      await this.loadAppData(attemptItem.key); // Weired life cycle... Don't want to rewrite since it works.
    }
  }

  componentDidMount() {
    void this.reload();
  }

  componentDidUpdate() {
    const {
      tabParameters: { tab },
      appData,
    } = this.state;
    if (appData && appData.getPageType() === "Streaming") return;
    //when show exedetail page let it sibling page hide
    handleDom(tab === "exedetail");
  }

  async loadAppData(attemptId) {
    this.setState({
      loading: true,
      loadingProgress: -1,
      loadingDataSize: 0,
      error: null,
    });

    this.helper.setAttemptId(attemptId);
    const nextState = {
      loading: false,
      applicationInfo: this.helper.appInfo,
      attemptId: attemptId,
      prevTab: "jobgraph",
    };
    try {
      let application = await this.helper.getApplication();
      application.checkError();
      application.updateDiagResults();
      nextState.appData = application;
      this.setState(nextState);
    } catch (err) {
      nextState.error = `fetch app data failed: ${err}`;
      console.error(err);
      this.setState(nextState);
    }
  }

  async reload() {
    const nextState = {
      loading: false,
    };
    // Fetch app basic info
    try {
      await this.helper.init();
    } catch (err) {
      nextState.error = `fetch app info failed: ${err}`;
      console.error(err);
      this.setState(nextState);
      return;
    }
    await this.loadAppData(this.state.attemptId);
  }

  getJobComboBoxItems(jobs) {
    let allJobs = [{ text: "All jobs", key: -1 }];
    jobs.forEach((job) => {
      allJobs.push({ text: "Job " + job.jobId, key: job.jobId });
    });
    return allJobs;
  }

  getAttemptIdComboBoxItems(applicationInfo) {
    if (applicationInfo.isAttemptIdNull) return [];
    return applicationInfo.appHistoricalInfo.map((info, index) => {
      const attemptId = Number(info.attemptId) <= 0 ? 0 : Number(info.attemptId) - 1
      return {
        key: attemptId,
        text: attemptId.toString(),
      };
    });
  }

  getErrorClassification(error) {
    // Check the failed jobs. It's just check the common pattern, which won't check more details error classifications since the error pattern is always changing.
    if (this.props.appInfo.jobStatus === "Failed") {
      console.log(`amContainerLogs: ${this.props.appInfo.amContainerLogs}`);

      // If the AM container failed to start, which has no AM container log.
      if (isEmpty(this.props.appInfo.amContainerLogs)) {
        return 'Failed to start AM Container. More details please click "View Exit Diagnostics".';
      }
      return 'AM Container started but running failed. More details please click "View Exit Diagnostics".';
    }

    if (error.indexOf("Request timed out") != -1) {
      return "Failed to get App data due to time out. Please re-try it later.";
    }

    // If "View Exit Diagnostics" or "Go to Application Tracking Page" is disabled by UI, it won't proprose user to click the details. The disable logic is aligned with UI.
    if (isNil(this.props.appInfo.appExitDiagnostics)) {
      return "No data can be found on Spark history server for this application.";
    } else {
      // return default pattern
      return 'No data can be found on Spark history server for this application. Details please click "View Exit Diagnostics"';
    }
  }

  onRenderItemLink(Link, defaultRenderer) {
    let iconAttribute = null;
    const { itemKey } = Link;
    if (itemKey == "diagnostics") {
      iconAttribute = { class: "icon warning14", href: "#icon-warning14" };
    } else if (itemKey == "errors") {
      iconAttribute = { class: "icon error2", href: "#icon-error2" };
    }
    return (
      <span className={c(t.flex, t.itemsCenter)}>
        <svg className={iconAttribute.class} aria-hidden="true">
          <use href={iconAttribute.href}></use>
        </svg>
        {defaultRenderer(Link)}
      </span>
    );
  }

  onRenderCombobox(
    selectedKey,
    comboBoxName,
    comboboxWidth,
    getItemsFun,
    clickCallback,
    right = 0,
    position = "absolute",
    top = 4,
    zIndex = 100,
  ) {
    return (
      <div
        style={{ position, top, right, zIndex }}
        className={c(t.flex, t.itemsCenter)}
      >
        <div className={c(t.flex, t.itemsCenter)}>
          <span className={c(t.mr3)}>{comboBoxName}:</span>
          <ComboBox
            options={getItemsFun}
            selectedKey={selectedKey}
            style={{ width: comboboxWidth }}
            onItemClick={clickCallback}
          />
        </div>
      </div>
    );
  }

  render() {
    const {
      loading,
      skewThreshold,
      error,
      appData,
      applicationInfo,
      tabParameters: { tab, jobId, stageId, exeId, attemptID },
      loadingProgress,
      loadingDataSize,
      attemptId,
      prevTab,
      appInfo,
    } = this.state;

    if (loading === undefined || loading === true) {
      return (
        <IndicatorLoading
          label={loadingDataSize}
          loadingProgress={loadingProgress}
        />
      );
    } else {
      if (appData && appData.getPageType() === "Streaming") {
        return (
          <AppData.Provider value={{ appData: appData }}>
            <Streaming
              onRenderItemLink={this.onRenderItemLink}
              onRenderCombobox={this.onRenderCombobox}
              callbackChangeTab={this.callbackChangeTab}
              onChangeJobCombobox={this.onChangeJobCombobox}
              appInfo={this.state.appInfo}
            />
          </AppData.Provider>
        );
      } else {
        return (
          <AppData.Provider value={{ appData: appData }}>
            {tab === "exedetail" ? (
              // new-executor
              <div className={c("new-executor")}>
                <ExecutorDetail
                  selectedExecutorId={exeId}
                  prevTab={prevTab}
                  callbackChangeTab={this.callbackChangeTab}
                />
              </div>
            ) : (
              <div className={c("parent", t.sansSerif, t.relative)}>
                {/* spark-degugging */}
              <div className={c("spark", t.sansSerif, t.relative)}>
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
              {!applicationInfo ||
              applicationInfo.isAttemptIdNull ||
              tab !== "jobgraph"
                ? ""
                : this.onRenderCombobox(
                    attemptId - 1,
                    "Attempt",
                    80,
                    this.getAttemptIdComboBoxItems(applicationInfo),
                    this.onChangeAttemptIdCombobox,
                    196,
                  )}
              {error ? (
                //spark-error-pivot
                <Pivot>
                  <PivotItem
                    className={c(t.pl0)}
                    headerText="Information"
                    itemKey="Information"
                  >
                    <div className={c(t.mt4)}>
                      {this.getErrorClassification(error)}
                    </div>
                  </PivotItem>
                </Pivot>
              ) : (
                <div>
                  {/* jobs comboBox */}
                  {tab === "jobgraph" || tab === "stages"
                    ? this.onRenderCombobox(
                        jobId,
                        "Jobs",
                        130,
                        this.getJobComboBoxItems(appData.jobs),
                        this.onChangeJobCombobox
                      )
                    : ""}
                  {/* spark-jobs-pivot */}
                  <Pivot onLinkClick={this.onChangeTab} selectedKey={tab}>
                    <PivotItem
                      className={c(t.pl0)}
                      headerText="Job Graph"
                      itemKey="jobgraph"
                    >
                      <JobGraph
                        selectedJobId={jobId}
                        callbackChangeTab={this.callbackChangeTab}
                      />
                    </PivotItem>
                    <PivotItem headerText="vCore Efficiency" itemKey="vcore">
                      <Vcore callbackChangeTab={this.callbackChangeTab} />
                    </PivotItem>
                    <PivotItem headerText="Runtime" itemKey="runtime">
                      <Runtime callbackChangeTab={this.callbackChangeTab} />
                    </PivotItem>
                    <PivotItem headerText="Stages" itemKey="stages">
                      <Stages
                        prevTab={prevTab}
                        appInfo={appInfo}
                        selectedJobId={jobId}
                        selectedStageId={stageId}
                        selectedAttemptId={attemptID}
                        callbackChangeTab={this.callbackChangeTab}
                      />
                    </PivotItem>
                    <PivotItem headerText="Executors" itemKey="executors">
                      <Executors appInfo={appInfo} callbackChangeTab={this.callbackChangeTab} />
                    </PivotItem>
                    <PivotItem
                      headerText="Diagnostics"
                      itemKey="diagnostics"
                      onRenderItemLink={
                        appData.hasSkew() ? this.onRenderItemLink : ""
                      }
                    >
                      <Diagnostics
                        appInfo={appInfo}
                        callbackChangeTab={this.callbackChangeTab}
                        skewThreshold={skewThreshold}
                        updateSkewThreshold={this.updateSkewThreshold}
                      />
                    </PivotItem>
                    <PivotItem
                      headerText="Errors"
                      itemKey="errors"
                      onRenderItemLink={
                        appData.hasError ? this.onRenderItemLink : ""
                      }
                    >
                      <ErrorInfos
                        appInfo={appInfo}
                        callbackChangeTab={this.callbackChangeTab}
                      />
                    </PivotItem>
                    <PivotItem headerText="Environment" itemKey="environment">
                      <Environment callbackChangeTab={this.callbackChangeTab} />
                    </PivotItem>
                  </Pivot>
                </div>
              )}
            </div>
              </div>
            )}
          </AppData.Provider>
        );
      }
    }
  }
}
