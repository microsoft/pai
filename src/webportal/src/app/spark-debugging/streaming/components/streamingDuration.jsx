import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { dialog } from "../common/tools";
import Convert from "../../models/utils/convert-utils";
import AppData from "../../components/common/appdata-context";
import HighChart from "../../components/common/highcharts/Highcharts";
import HighChartsProperty from "../../components/common/highcharts/Highchart";
import DurationDataContainer from "../../models/streaming/duration";
import { SpinnerLoading } from "../../../components/loading";

export default class Duration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      selectIndex: 0,
      durationInfos: null,
      chartPropertys: null,
      batchArr: null,
      callbackChangeTab: props.callbackChangeTab,
    };

    this.reload = this.reload.bind(this);
    this.handleChartClick = this.handleChartClick.bind(this);
    this.renderCharts = this.renderCharts.bind(this);
    this.handleRecords = this.handleRecords.bind(this);
  }

  componentDidMount() {
    void this.reload();
  }

  async handleChartClick(e, classname) {
    const { batchArr, callbackChangeTab } = this.state;
    const {
      point: { category },
    } = e;
    let jobs = [];
    try {
      const { appData } = this.context;
      jobs = await appData.getJobsByBatchId(batchArr[category]);
    } catch (error) {
      console.log(error);
    }

    if (jobs.length > 0) {
      callbackChangeTab("batchleveldebug", batchArr[category], -1, 0, -1);
    } else {
      dialog(classname, "#dialog", e);
    }
  }

  handleRecords(value, yUnitName) {
    if (value) {
      return Convert.formatTimeByUnitName(value, yUnitName);
    } else {
      return 0;
    }
  }

  renderCharts(durationInfos) {
    const infos = [];
    let batchArr = [];
    for (const i in durationInfos) {
      if (durationInfos.hasOwnProperty(i)) {
        infos.push({ [i]: durationInfos[i], name: i });
      }
    }
    this.setState({
      chartPropertys: infos.map((info, index) => {
        const { avg, p75, p95, data } = info[info.name];
        const chartTitles = [
          "Scheduling Delay",
          "Processing Time",
          "Total Delay",
        ];
        let handleData = data
          .filter((d) => d.value > 0)
          .map((d) => {
            return { y: d.value };
          });
        const { yUnitName } = Convert.getChartArguments(handleData);
        let Avg = this.handleRecords(avg, yUnitName);
        let P75 = this.handleRecords(p75, yUnitName);
        let P95 = this.handleRecords(p95, yUnitName);
        let categories = [];
        let nameInitial = info.name.charAt(0);
        const series = [
          {
            name: `${info.name.replace(
              nameInitial,
              nameInitial.toUpperCase()
            )}`,
            color: info.color || "#0088CC",
            data: data.map(({ batchTime, value }) => {
              const convertBatchTime = Convert.date("Y/m/d/H:i:s", batchTime);
              categories.push(convertBatchTime);
              batchArr[convertBatchTime] = batchTime;
              return [Convert.formatTimeByUnitName(value, yUnitName)];
            }),
            dataLabels: {
              enabled: false,
            },
          },
        ];
        const spaces = "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0";
        const chart = {
          id: `input-receiver-chart-${index}`,
          chartType: "column",
          chartTitle: {
            text: `${chartTitles[index]}`,
          },
          chartSubtitle: {
            text: `Avg: ${Avg} ${yUnitName} ${spaces} P75: ${P75} ${yUnitName} ${spaces} P95: ${P95} ${yUnitName}`,
          },
          category: "category",
          legend: { enabled: false },
        };
        const xAxis = {
          categories,
          crosshair: true,
        };
        const yAxis = {
          min: 0,
          titleText: `${chart.chartTitle.text} / ${yUnitName}`,
        };
        const tooltip = {
          formatter: function () {
            return "<b>" + this.y + yUnitName + " at " + "</b>" + this.x;
          },
        };
        return new HighChartsProperty(chart, xAxis, series, yAxis, tooltip);
      }),
      batchArr: batchArr,
    });
  }

  reload() {
    try {
      const { appData } = this.context;
      const durationInfos = new DurationDataContainer(appData).data;
      this.setState(
        {
          durationInfos: durationInfos,
        },
        () => {}
      );
      this.renderCharts(durationInfos);
    } catch (error) {
      // To do: log the error info.
      console.log(error);
    }
    this.setState(
      {
        loaded: true,
      }
    );
  }

  render() {
    const { loaded, chartPropertys } = this.state;
    return (
      <div className={c("streaming-duration-chart", t.mt4)}>
        {!loaded ? (
          <SpinnerLoading />
        ) : !chartPropertys ? (
          <div>No task data of the job.</div>
        ) : (
          chartPropertys.map((chartProperty, index) => {
            return (
              <div
                key={index}
                id={`streaming-duration-chart-${index}`}
                className={c(t.relative, `streaming-duration-chart-${index}`)}
              >
                <HighChart
                  key={index}
                  chartProperty={chartProperty}
                  handleChartClick={(e) =>
                    this.handleChartClick(
                      e,
                      `.streaming-duration-chart-${index}`
                    )
                  }
                />
              </div>
            );
          })
        )}
      </div>
    );
  }
}

Duration.contextType = AppData;
