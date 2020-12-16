// import "regenerator-runtime/runtime";
import React, { Component } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot";
import AppData from "../components/common/appdata-context";
import InputRate from "./components/streamingInputRate";
import Duration from "./components/streamingDuration";
import Error from "./components/streamingError";
import Executors from "./components/streamingExecutors";
import Vcore from "./components/streamingVcore";
import BatchLevelDebug from "./batchleveldebug/batchleveldebug";
import Diagnosis from "./components/diagnosis/streamingDiagnosis";
import { TabParameters, TabParameterHelper } from "./common/tab-parameters";
import { ThemeSettingName } from "office-ui-fabric-react";
import { handleDom } from "../components/common/table/utils";

export default class Streaming extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabParameters: new TabParameters("inputRate", 0, -1, 0, -1),
      prevTab: "inputRate",
      callbackChangeTab: props.callbackChangeTab,
      selectedExecutorId: null,
      onRenderItemLink: props.onRenderItemLink,
      onRenderCombobox: props.onRenderCombobox,
      errInfo: null,
      jobs: null,
      attemptId: this.props.appInfo.attemptId,
      appInfo: this.props.appInfo,
    };
    this.onChangeTab = this.onChangeTab.bind(this);
    this.callbackChangeTab = this.callbackChangeTab.bind(this);
    this.isShowBatchleveldebugPage = this.isShowBatchleveldebugPage.bind(this);
    this.reload = this.reload.bind(this);
    this.setSelectedExecutorId = this.setSelectedExecutorId.bind(this);
  }

  setSelectedExecutorId(exeId) {
    this.setState({selectedExecutorId: exeId});
  }

  onChangeTab({ props: { itemKey } }) {
    this.callbackChangeTab(itemKey);
  }

  callbackChangeTab(tab, batchTimeId, jobId, stageId, exeId, attemptID) {
    const prevParameters = this.state.tabParameters;
    let isChange = prevParameters.tab.search("batchleveldebug") > -1;
    this.setState(
      {
        prevTab: isChange ? this.state.prevTab : prevParameters.tab,
        tabParameters: {
          tab: tab,
          batchTimeId:
            batchTimeId || batchTimeId === 0
              ? batchTimeId
              : prevParameters.batchTimeId,
          jobId: jobId || jobId === 0 ? jobId : prevParameters.jobId,
          stageId: stageId || stageId === 0 ? stageId : prevParameters.stageId,
          attemptID: attemptID || attemptID === 0 ? attemptID : prevParameters.attemptID,
          exeId: exeId || exeId === 0 ? exeId : prevParameters.exeId,
          attemptID: attemptID || attemptID === 0 ? attemptID : prevParameters.attemptID,
        },
      },
      () => {
        this.isShowBatchleveldebugPage(tab);
        TabParameterHelper.updateHashParameters(this.state.tabParameters);
      }
    );
  }


  isShowBatchleveldebugPage(tab) {
    handleDom(tab.search("batchleveldebug") > -1);
  }

  componentDidMount() {
    this.reload();
  }

  reload() {
    try {
      const { appData } = this.context;
      this.setState({
        hasError: appData.hasStreamingError(),
        hasSkew: appData.hasStreamingSkew(),
      });
      this.isShowBatchleveldebugPage(this.state.tabParameters.tab);
    } catch (error) {}
  }

  render() {
    const {
      tabParameters,
      tabParameters: { tab, jobId, attemptID },
      prevTab,
      onRenderItemLink,
      onRenderCombobox,
      hasError,
      hasSkew,
      jobs,
      selectedExecutorId,
    } = this.state;
    return (
      // Batch level debug - running​
      tab.search("batchleveldebug") > -1 ? (
        <BatchLevelDebug
          tabParameters={tabParameters}
          prevTab={prevTab}
          callbackChangeTab={this.callbackChangeTab}
          onRenderCombobox={onRenderCombobox}
          onChangeJobCombobox={this.onChangeJobCombobox}
          selectedJobId={jobId}
          jobs={jobs}
          attemptID={attemptID}
          appInfo={this.state.appInfo}
        />
      ) : (
        <div className={c("parent", t.sansSerif, t.relative)}>
          {/* spark-degugging */}
          <div className={c("spark-streaming", t.sansSerif, t.relative)}>
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
            <Pivot onLinkClick={this.onChangeTab} selectedKey={tab}>
              <PivotItem
                className={c(t.pl0)}
                headerText="Input Rate"
                itemKey="inputRate"
              >
                <InputRate
                  callbackChangeTab={this.callbackChangeTab}
                />
              </PivotItem>
              <PivotItem headerText="Duration" itemKey="duration">
                <Duration
                  callbackChangeTab={this.callbackChangeTab}
                />
              </PivotItem>
              <PivotItem
                headerText="Error"
                itemKey="errors"
                onRenderItemLink={hasError ? onRenderItemLink : ""}
              >
                <Error callbackChangeTab={this.callbackChangeTab} />
              </PivotItem>
              <PivotItem
                headerText="Diagnosis"
                itemKey="diagnostics"
                onRenderItemLink={hasSkew ? onRenderItemLink : ""}
              >
                <Diagnosis
                  callbackChangeTab={this.callbackChangeTab}
                />
              </PivotItem>
              <PivotItem headerText="Executors" itemKey="executors">
                <Executors
                  callbackChangeTab={this.callbackChangeTab}
                  setSelectedExecutorId={this.setSelectedExecutorId}
                  appInfo={this.state.appInfo}
                />
              </PivotItem>
              <PivotItem headerText="Vcore Efficiency" itemKey="vcore">
                <Vcore callbackChangeTab={this.callbackChangeTab} />
              </PivotItem>
            </Pivot>
          </div>
        </div>
      )
    );
  }
}

Streaming.contextType = AppData;
