// import "regenerator-runtime/runtime";
import React, { Component } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { ComboBox, Icon } from "office-ui-fabric-react/lib";
import { ActionButton } from "office-ui-fabric-react/lib/Button";
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot";
import AppData from "../../components/common/appdata-context";
import BatchLeveJobGraph from "./batchLevejobbgraph/batchLeveJobGraph";
import BatchLeveStages from "./batchLeveStages/batchLeveStages";
import BatchLeveExecutors from "./batchLeveExecutor/batchExecutors";
import BatchLeveMetaData from "./batchLeveMeta/batchLeveMetaData";

export default class BatchLevelDebug extends Component {
  constructor(props) {
    super(props);
    this.state = {
      prevTab: props.prevTab,
      tabParameters: props.tabParameters,
      jobs: props.jobs,
      callbackChangeTab: props.callbackChangeTab,
      onRenderItemLink: props.onRenderItemLink,
      onRenderCombobox: props.onRenderCombobox,
      selectedExecutorId: null,
      appInfo: props.appInfo,
    };
    this.onChangeTab = this.onChangeTab.bind(this);
    this.clearClick = this.clearClick.bind(this);
    this.getJobComboBoxItems = this.getJobComboBoxItems.bind(this);
    this.onChangeJobCombobox = this.onChangeJobCombobox.bind(this);
    this.setSelectedExecutorId = this.setSelectedExecutorId.bind(this);
  }

  setSelectedExecutorId(exeId) {
    this.setState({selectedExecutorId: exeId});
  }

  onChangeTab({ props: { itemKey } }) {
    const {
      callbackChangeTab,
      tabParameters: { batchTimeId, jobId },
    } = this.props;

    callbackChangeTab(itemKey, batchTimeId, jobId, 0, -1);
  }

  componentDidMount() {
    this.reload();
  }

  async reload() {
    try {
      const {
        tabParameters: { batchTimeId },
      } = this.state;
      const { appData } = this.context;
      const batchJobs = await appData.getJobsByBatchId(batchTimeId);
      this.setState({ jobs: batchJobs });
    } catch (error) {}
  }

  clearClick() {
    this.state.callbackChangeTab(this.state.prevTab, 0, -1, 0, -1);
  }

  onChangeJobCombobox(e, job) {
    const {
      callbackChangeTab,
      tabParameters: { tab, batchTimeId },
    } = this.props;
    let jobId = job.text.toLowerCase() === "all jobs" ? -1 : job.key;
    callbackChangeTab(tab, batchTimeId, jobId, 0, -1);
  }

  getJobComboBoxItems(jobs) {
    let allJobs = [{ text: "All jobs", key: -1 }];
    if (jobs) {
      jobs.forEach((job) => {
        allJobs.push({ text: "Job " + job.jobId, key: job.jobId });
      });
    }
    return allJobs;
  }

  render() {
    const { tab, batchTimeId, jobId, stageId, attemptID } = this.props.tabParameters;
    const { onRenderCombobox, callbackChangeTab, jobs } = this.state;
    return (
      <div className={c("parent", t.sansSerif, t.relative)}>
        <div className={c("streaming-batchleveldebug")}>
          <div>
            <ActionButton
              iconProps={{ iconName: "revToggleKey" }}
              onClick={this.clearClick}
            >
              Back to Application
            </ActionButton>
          </div>
          <div className={c(t.relative)}>
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
            {/* streaming jobs comboBox */}
            {tab.search("batchleveldebug-jobgraph") > -1 ||
            tab === "batchleveldebug" ||
            tab.search("batchleveldebug-stages") > -1
              ? onRenderCombobox(
                  jobId,
                  "Jobs",
                  130,
                  this.getJobComboBoxItems(jobs),
                  this.onChangeJobCombobox
                )
              : ""}
            {/* streaming pivot */}
            <Pivot onLinkClick={this.onChangeTab} selectedKey={tab}>
              <PivotItem
                className={c(t.pl0)}
                headerText="Job graph"
                itemKey="batchleveldebug-jobgraph"
              >
                <BatchLeveJobGraph
                  batchTimeJobs={jobs}
                  selectedJobId={jobId}
                  batchTimeId={batchTimeId}
                  callbackChangeTab={callbackChangeTab}
                />
              </PivotItem>
              <PivotItem headerText="Stages" itemKey="batchleveldebug-stages">
                <BatchLeveStages
                  setSelectedExecutorId={this.setSelectedExecutorId}
                  batchTimeJobs={jobs}
                  callbackChangeTab={callbackChangeTab}
                  selectedJobId={jobId}
                  selectedStageId={stageId}
                  batchTimeId={batchTimeId}
                  appInfo={this.state.appInfo}
                />
              </PivotItem>
              <PivotItem
                headerText="Executors"
                itemKey="batchleveldebug-executor"
              >
                <BatchLeveExecutors
                  setSelectedExecutorId={this.setSelectedExecutorId}
                  callbackChangeTab={callbackChangeTab}
                  selectedJobId={jobId}
                  batchTimeJobs={jobs}
                  batchTimeId={batchTimeId}
                  appInfo={this.state.appInfo}
                />
              </PivotItem>
              <PivotItem headerText="Meta data" itemKey="batchleveldebug-error">
                <BatchLeveMetaData batchTimeId={batchTimeId} />
              </PivotItem>
            </Pivot>
          </div>
        </div>
      </div>
    );
  }
}

BatchLevelDebug.contextType = AppData;
