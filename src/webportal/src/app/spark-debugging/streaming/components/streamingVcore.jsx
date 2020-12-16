import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import Convert from "../../models/utils/convert-utils";
import * as vcore from "../../models/vcore/Vcore";
import AppData from "../../components/common/appdata-context";
import HighChart from "../../components/common/highcharts/Highcharts";
import HighChartsProperty from "../../components/common/highcharts/Highchart";
import { SpinnerLoading, Loading } from "../../../components/loading";

export default class Vcore extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      vcoreChartProperty: null,
      utilizationRate: null,
      loaded: false,
      callbackChangeTab: props.callbackChangeTab,
    };
    this.reload = this.reload.bind(this);
    this.renderVcoreChart = this.renderVcoreChart.bind(this);
    this.renderChart = this.renderChart.bind(this);
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
      const { dataSet = [] } = TaskHelp.getVcoreGraphData(appData, 100);

      if (dataSet && dataSet.length > 0) {
        totalUtilized =
          _.sum(dataSet.map((data) => data[1])) -
          dataSet[dataSet.length - 1][1] / 2;
        totalAllocated =
          _.sum(dataSet.map((data) => data[2])) -
          dataSet[dataSet.length - 1][2] / 2;
      }

      this.renderChart(dataSet, appData.appEnvInfo);
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

  renderChart(dataSet, appDataAppEnvInfo) {
    this.renderVcoreChart(dataSet, appDataAppEnvInfo);
  }

  renderVcoreChart(data, appEnvInfo) {
    const { TaskHelp } = vcore;
    if (data.length <= 0) return;
    const labels = data.map((d) => Convert.date("Y/m/d/H:i:s", d[0]));
    const chart = {
      id: "spark-streaming-vcore-chart",
      chartType: "line",
      chartTitle: { text: "vCore" },
    };
    const xAxis = {
      categories: labels,
    };
    const yAxis = {
      titleText: "Number of vCores",
      categories: [],
      min: 0,
    };
    const names = ["Utilized vCore", "Allocated vCore"];
    const series = names.map((labelName, index) => {
      return {
        name: labelName,
        data: data.map((vCore) => {
          return vCore.slice(1, vCore.length)[
            names.findIndex((n) => n == labelName)
          ];
        }),
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
        },
        lineWidth: 2,
      };
    });

    let totalVcore = TaskHelp.getTotalvCore(appEnvInfo);

    if (totalVcore > 0) {
      const requestVcore = data.map((d) => totalVcore);
      series.push({
        name: "Requested vCore",
        data: requestVcore,
        marker: {
          enabled: true,
          symbol: "circle",
          radius: 3,
        },
        lineWidth: 2,
      });
    }
    const tooltip = {
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
    return labels;
  }

  render() {
    const { vcoreChartProperty, utilizationRate, loaded } = this.state;
    return !loaded ? (
      <SpinnerLoading />
    ) : !vcoreChartProperty ? (
      <div className={c(t.mt4)}>
        No vCore data of the job since no task data.
      </div>
    ) : (
      <div className={c(t.mt4)} id="vCoreContainer">
        <HighChart chartProperty={vcoreChartProperty} />
        <div className={c(t.fw6)}>
          <span>vCore utilization rate is </span>
          {utilizationRate && utilizationRate.toFixed(4)}%.
        </div>
      </div>
    );
  }
}

Vcore.contextType = AppData;
