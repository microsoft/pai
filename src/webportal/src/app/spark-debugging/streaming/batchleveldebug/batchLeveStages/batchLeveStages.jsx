import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import { DefaultSpinner } from "../../../components/common/loading/loading";
import Convert from "../../../models/utils/convert-utils";
import StageTaskDataSkew from "../../../models/stages/stage-task-skew";
import StageSummaryTable from "../../../models/stages/stage-summary-table";
import StageTaskDetail from "../../../models/stages/stage-task-table";
import StageSummary from "./stageSummary";
import CommonDebugTable from "../../../components/common/table/CommonDebugTable";
import TableProperty from "../../../components/common/table/TableProperty";
import AppData from "../../../components/common/appdata-context";
import { ComboBox, Stack, StackItem, Link } from "office-ui-fabric-react";
import HighChart from "../../../components/common/highcharts/Highcharts";
import HighChartsProperty from "../../../components/common/highcharts/Highchart";
import TeachingBubble from "../../../components/common/TeachingBubble/";
import "./stages.css";

export default class BatchLeveStages extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      batchTimeId: props.batchTimeId,
      selectedJobId: props.selectedJobId,
      appInfo: props.appInfo,
      selectedStageId:
        !props.selectedStageId || props.selectedStageId == -1
          ? 0
          : props.selectedStageId,
      callbackChangeTab: props.callbackChangeTab,
      setSelectedExecutorId: props.setSelectedExecutorId,
      taskData: null,
      summaryData: null,
      chartData: null,
      stageList: null,

      tableProperty: null,
      chartProperty: null,
      canvasId: "taskchart",
      loaded: true,
      isTeachingBubbleVisible: false,
      selectedStage: null,
    };
    this.reload = this.reload.bind(this);
    this.filterStages = this.filterStages.bind(this);
    this.renderTaskTable = this.renderTaskTable.bind(this);
    this.renderTaskChart = this.renderTaskChart.bind(this);

    this.onChangeStageCombobox = this.onChangeStageCombobox.bind(this);
    this.handleClickExeId = this.handleClickExeId.bind(this);
  }

  handleClickExeId(exeId) {
    this.state.callbackChangeTab(
      "batchleveldebug-exedetail",
      null,
      null,
      exeId
    );
  }

  onChangeStageCombobox(e, Stages) {
    const {
      callbackChangeTab,
      selectedJobId,
      selectedStageId,
      batchTimeId,
    } = this.state;
    this.setState(
      {
        selectedStageId: Stages.key,
      },
      () => {
        this.filterStages(selectedJobId, selectedStageId, batchTimeId);
        callbackChangeTab(
          "batchleveldebug-stages",
          batchTimeId,
          selectedJobId,
          selectedStageId,
          0
        );
      }
    );
  }

  componentDidMount() {
    void this.reload();
  }

  componentDidUpdate(prevProps) {
    const { selectedJobId, selectedStageId, batchTimeId } = this.props;
    // Typical usage (don't forget to compare props):
    if (selectedJobId !== prevProps.selectedJobId) {
      this.setState(
        {
          selectedJobId: selectedJobId,
        },
        () => {
          this.filterStages(selectedJobId, selectedStageId, batchTimeId);
        }
      );
    }
  }

  async reload() {
    this.filterStages(
      this.state.selectedJobId,
      this.state.selectedStageId,
      this.state.batchTimeId
    );
  }

  async filterStages(selectedJobId, selectedStageId, batchTimeId) {
    const { appData } = this.context;
    try {
      if (!appData || !appData.jobs) return;
      let allStages =
        selectedJobId === -1
          ? await appData.getStageSimpleInfosByBatchId(batchTimeId)
          : appData.getSpecifyJobStagesSimpleInfo(selectedJobId);
      let stages = allStages.filter((x) => x.status != "SKIPPED");
      
      if (!stages || stages.length <= 0)
        return this.setState({ loaded: false });
      let stage = stages.filter((x) => x.key === Number(selectedStageId));
      stage = stage && stage.length > 0 ? stage[0] : stages[0];
      this.setState(
        {
          selectedStageId: stage.key,
          stageList: stages,
          chartData: StageTaskDataSkew.getAllTasks(
            stage.key,
            stage.attemptId,
            appData
          ),
          summaryData: await StageSummaryTable.getStageSummaryData(
            appData.helper,
            stage.key,
            stage.attemptId
          ),
          taskData: await StageTaskDetail.getStageTaskData(
            stage.key,
            stage.attemptId,
            appData
          ),
        },
        () => {
          const {
            taskData,
            chartData,
            selectedStageId,
            callbackChangeTab,
            batchTimeId,
            selectedJobId,
          } = this.state;

          this.renderTaskTable(taskData);
          this.renderTaskChart(chartData);
          if (selectedStageId !== selectedStageId) {
            callbackChangeTab(
              "batchleveldebug-stages",
              batchTimeId,
              selectedJobId,
              selectedStageId
            );
          }
        }
      );
    } catch (error) {
      console.log(error);
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
      { key: "ExecutorID", minWidth: 80, maxWidth: 80, disabled: true },
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
        Host: (<Stack key={index} horizontal horizontalAlign='space-between'>
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

    this.setState({
      tableProperty: new TableProperty(
        columnHeaderArray,
        columnDataItemArray,
        ["TaskID", "Status"],
        "Status"
      ),
      loaded: false,
    });
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
      selectedStageId,
      taskData,
      summaryData,
      stageList,
      tableProperty,
      chartProperty,
      loaded,
    } = this.state;

    const summaryDataBool = Convert.isNotEmptyArray(summaryData);
    const taskDataBool = Convert.isNotEmptyArray(taskData);
    const selectedStage =
      stageList && stageList.find((stage) => stage.key === selectedStageId);
    try {
      return loaded ? (
          <DefaultSpinner />
      ) : !stageList ? (
        <div className={c(t.mt4)}>
          No stage data of the batchTime
        </div>
      ) : (
        <div className={c("batchleveldebug-stages", t.mt4)}>
          <div className={c(t.flex, t.justifyCenter, t.mb3, t.itemsCenter)}>
            <span className={c(t.mr3)}>Stages:</span>
            <ComboBox
              options={stageList}
              selectedKey={selectedStageId}
              style={{ width: 150 }}
              onItemClick={this.onChangeStageCombobox}
            />
            <TeachingBubble name={"details"} stage={selectedStage} />
            {selectedStage.failureReason &&
              selectedStage.failureReason != "None" && (
                <TeachingBubble name={"error"} stage={selectedStage} />
              )}
          </div>
          {!summaryDataBool && !taskDataBool ? (
            <div>
              No task data can be found for the stage
            </div>
          ) : (
            <div>
              {summaryDataBool && <StageSummary summaryData={summaryData} />}
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

BatchLeveStages.contextType = AppData;
