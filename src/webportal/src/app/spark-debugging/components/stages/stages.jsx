import React, { useEffect, useState, useLayoutEffect, useMemo } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import Convert from "../../models/utils/convert-utils";
import StageTaskDataSkew from "../../models/stages/stage-task-skew";
import StageSummaryTable from "../../models/stages/stage-summary-table";
import StageTaskDetail from "../../models/stages/stage-task-table";
import SummaryTable from "./stage-summary";
import CommonDebugTable from "../common/table/CommonDebugTable";
import TableProperty from "../common/table/TableProperty";
import AppData from "../common/appdata-context";
import { ComboBox, Link, Stack, StackItem } from "office-ui-fabric-react";
import CommonChart from "../common/chart/CommonChart";
import ChartProperty from "../common/chart/ChartProperty";
import HighChart from "../common/highcharts/Highcharts";
import HighChartsProperty from "../common/highcharts/Highchart";
import { SpinnerLoading } from "../../../components/loading";
import TeachingBubble from "../common/TeachingBubble/";
import "./stages.css";

export default class Stages extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      taskData: null,
      summaryData: null,
      chartData: null,
      stageList: [],
      attemptList: [],

      tableProperty: null,
      chartProperty: null,
      canvasId: "taskchart",
      loaded: true,
      selectedStage: null,
      selectedAttempt: null,
      appInfo: props.appInfo,
    };
    this.reload = this.reload.bind(this);
    this.updateStagesData = this.updateStagesData.bind(this);
    this.renderTaskTable = this.renderTaskTable.bind(this);
    this.renderTaskChart = this.renderTaskChart.bind(this);

    this.onChangeStageCombobox = this.onChangeStageCombobox.bind(this);
    this.onChangeAttemptCombobox = this.onChangeAttemptCombobox.bind(this);
    this.handleClickExeId = this.handleClickExeId.bind(this);
  }

  handleClickExeId(exeId) {
    this.props.callbackChangeTab("exedetail", null, null, exeId, null);
  }

  onChangeStageCombobox(e, stageItem) {
    this.props.callbackChangeTab(
      "stages",
      this.props.selectedJobId,
      stageItem.key,
      0,
      -1
    );
  }

  onChangeAttemptCombobox(e, attempt) {
    this.props.callbackChangeTab(
      "stages",
      this.props.selectedJobId,
      this.props.selectedStageId,
      0,
      attempt.key
    );
  }

  updateStageList() {
    const {appData} = this.context;
    let stageList = this.props.selectedJobId === -1 ? appData.getAllStages() : appData.getJob(this.props.selectedJobId).stages;
    stageList = stageList.filter((s) => s.attempts.some((a) => a.status !== 'SKIPPED'));
    const stageId = stageList.length ? stageList[0].stageId : -1;
    if (stageList.find((s) => s.stageId === this.props.selectedStageId) === undefined) {
      this.props.callbackChangeTab(
        "stages",
        this.props.selectedJobId,
        stageId, // use first stage as default
        0,
        -1,
      );
    }
    this.setState({
      stageList,
    });
  }

  updateAttemptList(stage) {
    const attemptList = stage ? stage.attempts.slice(-10).reverse() : null; // TODO: make this a constant
    if ((attemptList && attemptList.find((a) => a.attemptId === this.props.selectedAttemptId) === undefined) || (attemptList && this.props.prevTab !== "stages" && this.props.prevTab !== "vcore")) {
      // Fallback to latest attempt here
      // What if attemptList is empty
      const {attemptId= -1} = attemptList[0];
      this.props.callbackChangeTab(
        "stages",
        this.props.selectedJobId,
        this.props.selectedStageId, 
        0,
        attemptId // use latest attempt as default
      );
    }
    this.setState({
      attemptList,
    });
  }

  componentDidMount() {
    this.updateStageList();
    this.reload();
  }

  componentDidUpdate(prevProps) {
    // selected jobId and stageId are controlled by parent component. Access them in this.props
    if (this.props.selectedJobId !== prevProps.selectedJobId) {
      this.updateStageList();
    }
    if ((this.props.selectedStageId !== prevProps.selectedStageId) || (this.props.selectedAttemptId !== prevProps.selectedAttemptId)) {
      this.reload();
    }
  }

  async reload() {
    await this.updateStagesData();
  }

  async updateStagesData() {
    this.setState({loaded: true});
    const {selectedStageId, selectedAttemptId} = this.props;
    const {appData} = this.context;
    // Stage must exist
    let selectedStage = appData.getSpecifyStage(selectedStageId);
    this.updateAttemptList(selectedStage);
    if (!selectedStage) {
      this.setState({loaded: false});
      return;
    }
    let selectedAttempt = selectedStage.getAttempt(selectedAttemptId);
    if (!selectedAttempt) {
      return;
    }
    try {
      this.setState({
        chartData: StageTaskDataSkew.getAllTasks(
          selectedAttempt.stageId,
          selectedAttempt.attemptId,
          appData
        ),
        summaryData: await StageSummaryTable.getStageSummaryData(
          appData.helper,
          selectedAttempt.stageId,
          selectedAttempt.attemptId,
        ),
        taskData: StageTaskDetail.getStageTaskData(
          selectedAttempt.stageId,
          selectedAttempt.attemptId,
          appData
        ),
        selectedStage: selectedStage,
        selectedAttempt: selectedAttempt,
      }, () => {
        this.renderTaskTable(this.state.taskData);
        this.renderTaskChart(this.state.chartData);
        this.setState({loaded: false});
      });
    } catch (error) {
      this.setState({loaded: false});
      console.error(error);
    }
  }

  renderTaskTable(taskData) {
    if (!Convert.isNotEmptyArray(taskData)) return;
    const {appId, jobStatus, attemptId} = this.state.appInfo;
    const params = new URLSearchParams(window.location.search);
    const subCluster = params.get('subCluster');

    //Set debug table properties
    //step1. set table headers
    let columnHeaderArray = [
      { key: "Index", minWidth: 45, maxWidth: 45 },
      { key: "TaskID", minWidth: 50, maxWidth: 50 },
      { key: "Attempt", minWidth: 60, maxWidth: 60 },
      { key: "Status", minWidth: 55, maxWidth: 55 },
      { key: "LocalityLevel", minWidth: 85, maxWidth: 85 },
      { key: "ExecutorID", minWidth: 80, maxWidth: 80 },
      { key: "Host", minWidth: 160, maxWidth: 160, disabled: true },
      { key: "LaunchTime", minWidth: 120, maxWidth: 120 },
      { key: "Duration", minWidth: 70, maxWidth: 70 },
      { key: "ExecutorCpuTime", minWidth: 125, maxWidth: 125 },
      { key: "GcTime", minWidth: 60, maxWidth: 60 },
      { key: "SchedulerDelay", minWidth: 110, maxWidth: 110 },
      { key: "Input Read Size/Records", minWidth: 80, maxWidth: 80 },
      { key: "Output Write Size/Records", minWidth: 80, maxWidth: 120 },
      { key: "Shuffle Read Size/Records", minWidth: 80, maxWidth: 80 },
      { key: "Shuffle Write Size/Records", minWidth: 80, maxWidth: 120 },
      { key: "Errors", minWidth: 60, disabled: true },
    ];
    //step2. set table data items content
    const columnDataItemArray = taskData.map((task, index) => {
      return {
        Index: task.index,
        TaskID: task.taskId,
        Attempt: task.attempt,
        Status: task.status,
        LocalityLevel: task.taskLocality,
        ExecutorID: Number(task.executorId),
        'Host': (<Stack key={index} horizontal horizontalAlign='space-between'>
                  <StackItem>{task.host}</StackItem>
                  <StackItem>
                    <Link
                      href={`/logView.html?appId=${appId}&jobType=SPARK&executorId=${Number(task.executorId)}&jobStatus=${jobStatus}&subCluster=${subCluster}&attemptId=${attemptId}`}
                      onClick={(event) => {
                        event.preventDefault();
                        window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
                      }}
                    >&nbsp;Logs</Link>
                  </StackItem>
                </Stack>),
        LaunchTime: task.launchTime,
        GcTime: task.jvmGcTime,
        SchedulerDelay: task.schedulerDelay,
        Duration: task.duration,
        ExecutorCpuTime: task.executorCpuTime,
        "Input Read Size/Records": task.readBytes,
        recordsRead: task.recordsRead,
        "Output Write Size/Records": task.bytesWritten,
        recordsWritten: task.recordsWritten,
        "Shuffle Read Size/Records":
          task.shuffleLocalBytesRead + task.shuffleRemoteBytesRead,
        shuffleRecordsRead: task.shuffleRecordsRead,
        "Shuffle Write Size/Records": task.shuffleBytesWritten,
        shuffleRecordsWritten: task.shuffleRecordsWritten,
        Errors: <span title={task.errorMessage}>{task.errorMessage}</span>,
        TaskExecutorIdExist: task.taskExecutorIdExist,
      };
    });

    this.setState(
      {
        tableProperty: new TableProperty(
          columnHeaderArray,
          columnDataItemArray,
          ["TaskID", "Status"],
          "Status"
        ),
      }
    );
  }

  renderTaskChart(chartData) {
    if (!Convert.isNotEmptyArray(chartData)) return;
    const handleChartData = chartData.map((d) => {
      return { index: d[2], x: d[0], y: d[1] };
    });
    //Gets the maximum value and conversion unit for the axis
    const { xMax, yMax, xUnitName, yUnitName } = Convert.getChartArguments(
      handleChartData
    );
    const convertXMax = Convert.formatBytesByUnitName(xMax, xUnitName);
    const convertYMax = Convert.formatTimeByUnitName(yMax, yUnitName);
    const chart = {
      id: "state-chart",
      chartType: "scatter",
      chartTitle: { text: "Task Scatter in stage" },
    };
    const xAxis = {
      max: Convert.handleMax(convertXMax),
      titleText: "Data Size / " + xUnitName,
    };
    const yAxis = {
      max: Convert.handleMax(convertYMax),
      titleText: "Exectution Time / " + yUnitName,
    };
    const series = [
      {
        name: "Task ID",
        data: handleChartData.map((d) => {
          return [
            Convert.formatBytesByUnitName(d.x, xUnitName),
            Convert.formatTimeByUnitName(d.y, yUnitName),
          ];
        }),
      },
    ];
    const tooltip = {
      formatter: function () {
        const alikeTask = handleChartData.filter((d) => {
          return (
            Convert.formatTimeByUnitName(d.y, yUnitName) === this.y &&
            Convert.formatBytesByUnitName(d.x, xUnitName) === this.x
          );
        });
        return (
          "<b>" +
          this.series.name +
          ": " +
          alikeTask.map((e) => e.index).join() +
          "</b><br/>" +
          "x: " +
          this.x +
          xUnitName +
          " " +
          "y: " +
          this.y +
          yUnitName
        );
      },
    };

    this.setState(
      {
        chartProperty: new HighChartsProperty(
          chart,
          xAxis,
          series,
          yAxis,
          tooltip
        ),
      }
    );
  }

  render() {
    const {
      taskData,
      summaryData,
      tableProperty,
      chartProperty,
      loaded,
      selectedAttempt,
      attemptList,
      stageList,
    } = this.state;

    const summaryDataBool = Convert.isNotEmptyArray(summaryData);
    const taskDataBool = Convert.isNotEmptyArray(taskData);
    try {
      return loaded ? (
        <SpinnerLoading />
      ) : !stageList ? (
        <div className={c(t.mt4)}>No stage data of the job.</div>
      ) : (
        <div className={c("stages", t.mt4)}>
          <div className={c(t.flex, t.justifyCenter, t.mb3, t.itemsCenter)}>
            <span className={c(t.mr3)}>Stages:</span>
            <ComboBox
              options={stageList.map(
                (s) => ({
                  text: 'stage ' + s.stageId,
                  key: s.stageId,
                })
              )}
              selectedKey={this.props.selectedStageId}
              style={{ width: 150 }}
              onItemClick={this.onChangeStageCombobox}
            />
            <span className={c(t.mr3, t.ml3)}>Attempts:</span>
            <ComboBox
              options={attemptList.map(
                (a) => ({
                  text: 'attempt ' + (a.attemptId || 0),
                  key: a.attemptId || 0,
                })
              )}
              selectedKey={this.props.selectedAttemptId}
              style={{ width: 150 }}
              onItemClick={this.onChangeAttemptCombobox}
            />
            <div>
              <TeachingBubble name={"details"} stage={selectedAttempt} />
              {selectedAttempt && selectedAttempt.failureReason &&
                selectedAttempt.failureReason !== "None" && (
                  <TeachingBubble name={"error"} stage={selectedAttempt} />
                )}
            </div>
          </div>
          {!summaryDataBool && !taskDataBool ? (
            <div>
              No task data can be found for the stage
            </div>
          ) : (
            <div>
              {!summaryDataBool ? (
                <div className={c(t.pv3)}>
                  No summary data for this stage
                </div>
              ) : (
                <SummaryTable summaryData={summaryData} />
              )}
              {!taskDataBool ? (
                ""
              ) : (
                <div>
                  {!chartProperty ? (
                    ""
                  ) : (
                    <HighChart chartProperty={chartProperty} />
                  )}
                  {!tableProperty ? (
                    ""
                  ) : (
                    <CommonDebugTable
                      handleClickExeId={this.handleClickExeId}
                      tableProperty={tableProperty}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    } catch (e) {
      console.log(e);
      return (
        <div>
          Get error when fetch stage data Spark history server
        </div>
      );
    }
  }
}

Stages.contextType = AppData;
