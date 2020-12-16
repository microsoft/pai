import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { compact } from "lodash";
import Convert from "../../models/utils/convert-utils";
import * as vcore from "../../models/vcore/Vcore";
import AppData from "../common/appdata-context";
import HighChart from "../common/highcharts/Highcharts";

import HighChartsProperty from "../common/highcharts/Highchart";
import {
  handlechartHoverEvent,
  syncExtremes,
} from "../common/highcharts/utils";
import { SpinnerLoading, Loading } from "../../../components/loading";
export default class Vcore extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      vcoreChartProperty: null,
      stageChartProperty: null,
      utilizationRate: null,
      mockStages: [],
      loaded: false,
      callbackChangeTab: props.callbackChangeTab,
    };
    this.reload = this.reload.bind(this);
    this.renderVcoreChart = this.renderVcoreChart.bind(this);
    this.renderChart = this.renderChart.bind(this);
    this.renderStageChart = this.renderStageChart.bind(this);
    this.handleChartClick = this.handleChartClick.bind(this);
  }

  componentDidMount() {
    void this.reload();
  }

  async reload() {
    const { appData } = this.context;
    const { TaskHelp } = vcore;
    let totalUtilized = 0.0;
    let totalAllocated = 0.0;
    try {
      const { dataSet, stages } = TaskHelp.getVcoreGraphData(appData, 100);
      if (dataSet && dataSet.length > 0) {
        totalUtilized =
          _.sum(dataSet.map((data) => data[1])) -
          dataSet[dataSet.length - 1][1] / 2;
        totalAllocated =
          _.sum(dataSet.map((data) => data[2])) -
          dataSet[dataSet.length - 1][2] / 2;
      }

      this.renderChart(dataSet, appData.appEnvInfo, stages);
    } catch (e) {
      console.log(e);
    }

    this.setState(
      {
        utilizationRate:
          totalAllocated > 0 ? (totalUtilized * 100.0) / totalAllocated : null,
        loaded: true,
      }
    );
  }

  renderChart(dataSet, appDataAppEnvInfo, stages) {
    this.renderVcoreChart(dataSet, appDataAppEnvInfo);
    this.renderStageChart(stages);
  }

  renderVcoreChart(data, appDataAppEnvInfo) {
    if (data.length <= 0) return;
    const chart = {
      id: "vcore-chart",
      chartType: "line",
      chartTitle: { text: "vCore" },
      marginLeft: 80, // Keep all charts left aligned
      spacingTop: 20,
      spacingBottom: 20,
    };
    const xAxis = {
      tyep: "datetime",
      crosshair: { width: 4 },
      startOnTick: true,
      tickPixelInterval: 5,
      events: {
        setExtremes: syncExtremes,
      },
      labels: {
        rotation: -40,
        formatter: function () {
          return Convert.date("Y/m/d/H:i", this.value);
        },
      },
    };
    const yAxis = {
      titleText: "Number of vCores",
      categories: [],
    };
    const names = ["Utilized vCore", "Allocated vCore"];
    const series = names.map((labelName, index) => {
      return {
        name: labelName,
        lineWidth: 3,
        data: data.map((vCore) => {
          return [
            vCore[0],
            vCore.slice(1, vCore.length)[
              names.findIndex((n) => n == labelName)
            ],
          ];
        }),
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
        },
      };
    });
    const { TaskHelp } = vcore;
    let totalVcore = TaskHelp.getTotalvCore(appDataAppEnvInfo);
    if (totalVcore > 0) {
      const requestVcore = data.map((d) => [d[0], totalVcore]);
      series.unshift({
        name: "Requested vCore",
        data: requestVcore,
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
        },
        lineWidth: 3,
      });
    }

    const tooltip = {
      formatter: function () {
        let t = this.x;
        const point = data.find((vcore) => vcore[0] == this.x);
        return `<div>Time: ${Convert.date(
          "Y/m/d/H:i:s",
          t
        )}</div><br><b>Requested vCore: ${
          totalVcore > 0 ? totalVcore : ""
        }</b><br><b>Utilized vCore: ${point[1]}</b><br><b>Allocated vCore: ${
          point[2]
        }</b>`;
      },
      split: true,
    };
    this.setState(
      {
        vcoreChartProperty: new HighChartsProperty(
          chart,
          xAxis,
          series,
          yAxis,
          tooltip
        ),
      }
    );
  }

  renderStageChart(stageS) {
    // clone stages
    let stages = [...stageS];
    let mockStages = [];
    let indexList = [];
    let stageIdLIst = [];
    const seriesDatas = stages.map((stage, i) => {
      if (stage.stageId || stage.stageId === 0) {
        const nextId = stages[i + 1].stageId * 1;
        const curId = stage.stageId * 1;
        stageIdLIst.push(curId);
        if (nextId - curId != 0) {
          indexList.push({ i: i, time: stage.time, id: curId });
        }
        return [stage.time, curId];
      } else {
        return { x: stage.time, y: null };
      }
    });
    indexList.forEach((stage, i) => {
      seriesDatas.splice(stage.i + (i + 1), 0, {
        x: stage.time,
        y: null,
      });
    });
    mockStages = stages.map((stage) => {
      stageIdLIst = [...new Set(stageIdLIst)].sort((a, b) => a - b);
      const lastId = stageIdLIst[stageIdLIst.length - 1];
      return {
        x: stage.time,
        y: lastId ? lastId + 1 : 0,
        stageId: stage.stageId || 0,
        attemptId: stage.attemptId || 0,
      };
    });
    const chart = {
      id: "stage-char",
      chartType: "line",
      chartTitle: { text: "Stage" },
      marginLeft: 80, // Keep all charts left aligned
      spacingTop: 20,
      spacingBottom: 20,
    };
    const xAxis = {
      tyep: "datetime",
      crosshair: { width: 4 },
      startOnTick: true,
      tickPixelInterval: 5,
      events: {
        setExtremes: syncExtremes,
      },
      labels: {
        rotation: -40,
        formatter: function () {
          return Convert.date("Y/m/d/H:i", this.value);
        },
      },
    };
    const yAxis = {
      titleText: "Stage ID",
      min: 0,
      tickInterval: 1,
    };
    const series = [
      {
        color: "#fff",
        data: mockStages,
        lineWidth: 0,
        showInLegend: false,
        marker: {
          enabled: false,
        },
        states: {
          hover: {
            enabled: false,
          },
        },
        cursor: "",
      },
      {
        name: `stage ( ${stageIdLIst.join()} )`,
        color: "red",
        data: seriesDatas,
        lineWidth: 3,
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
        },
      },
    ];
    const tooltip = {
      borderColor: "red",
      formatter: function () {
        const points = stageS.filter((stage) => stage && stage.time == this.x);
        let stageIds = [...new Set(points.map((stage) => {
          if (stage.stageId >= 0) {
            return stage.stageId;
          }
        }))];
        stageIds = stageIds.length > 0 ? stageIds.join("; ") : "";
        const totalTaskNumber = stageIds
          ? points
              .map(
                (stage) => stage.runningTaskCount + "/" + stage.totalTaskCount
              )
              .join("; ")
          : 0;
        return `<div>Time: ${Convert.date("Y/m/d/H:i:s", this.x)}</div><br>
        <b>Stage Id: ${stageIds}</b><br>
        <b>Task Number: ${totalTaskNumber}</b>`;
      },

      split: true,
    };
    this.setState(
      {
        stageChartProperty: new HighChartsProperty(
          chart,
          xAxis,
          series,
          yAxis,
          tooltip
        ),
      }
    );
  }
  handleChartClick(stage) {
    const { attemptId, stageId, x } = stage.point;
    this.state.callbackChangeTab("stages", -1, stageId, null, attemptId);
  }

  componentDidUpdate() {
    // Chart linkage
    handlechartHoverEvent("#vCoreContainer");
  }

  render() {
    const {
      vcoreChartProperty,
      utilizationRate,
      loaded,
      stageChartProperty,
    } = this.state;
    return !loaded ? (
      <SpinnerLoading />
    ) : !vcoreChartProperty ? (
      <div className={c(t.mt4)}>
        No vCore data of the job since no task data.
      </div>
    ) : (
      <div className={c(t.mt4)} id="vCoreContainer">
        <HighChart chartProperty={vcoreChartProperty} />
        <HighChart
          chartProperty={stageChartProperty}
          handleChartClick={this.handleChartClick}
        />
        <div className={c(t.fw6)}>
          {utilizationRate && (
            <span>
              vCore utilization rate is {utilizationRate.toFixed(4)}%.
            </span>
          )}
        </div>
      </div>
    );
  }
}

Vcore.contextType = AppData;
