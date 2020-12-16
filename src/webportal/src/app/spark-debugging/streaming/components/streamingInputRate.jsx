import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { dialog } from "../common/tools";
import Convert from "../../models/utils/convert-utils";
import AppData from "../../components/common/appdata-context";
import HighChart from "../../components/common/highcharts/Highcharts";
import HighChartsProperty from "../../components/common/highcharts/Highchart";
import InputRateDataContainer from "../../models/streaming/input-rate";
import { SpinnerLoading } from "../../../components/loading";

export default class InputRate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      selectIndex: 0,
      inputRate: null,
      inputRateArr: [],
      receivers: null,
      receiverArr: [],
      chartProperty: null,
      chartPropertys: null,
      callbackChangeTab: props.callbackChangeTab,
    };

    this.reload = this.reload.bind(this);
    this.handleInputRateChartClick = this.handleInputRateChartClick.bind(this);
    this.handleReceiverChartClick = this.handleReceiverChartClick.bind(this);
    this.renderChart = this.renderChart.bind(this);
    this.renderCharts = this.renderCharts.bind(this);
    this.handleRecords = this.handleRecords.bind(this);
    this.handleChartClick = this.handleChartClick.bind(this);
  }

  componentDidMount() {
    void this.reload();
  }

  async handleChartClick(classname, e, arr) {
    const {
      point: { category },
    } = e;
    let jobs = []
    try {
      const { appData } = this.context;
      jobs = await appData.getJobsByBatchId(arr[category]);
    } catch (error) {
      console.log(error);
    }
    if (jobs.length > 0) {
      this.state.callbackChangeTab("batchleveldebug", arr[category], -1, 0, -1);
    } else {
      dialog(classname, "#dialog", e);
    }
  }

  handleInputRateChartClick(e, classname) {
    const { inputRateArr } = this.state;
    this.handleChartClick(classname, e, inputRateArr);
  }

  async handleReceiverChartClick(e, classname) {
    const { receiverArr } = this.state;
    this.handleChartClick(classname, e, receiverArr);
  }

  handleRecords(num) {
    if (num) {
      return Math.round(num);
    } else {
      return 0;
    }
  }

  renderChart(inputRateInfos) {
    const { avgInputRate, inputRateP75, inputRateP95, data } = inputRateInfos;
    let Avg = this.handleRecords(avgInputRate);
    let P75 = this.handleRecords(inputRateP75);
    let P95 = this.handleRecords(inputRateP95);
    const categories = [];
    const inputRateArr = [];
    const series = [
      {
        name: "Input Rate",
        color: inputRateInfos.color || "#0088CC",
        data: data.map(({ batchTime, recordsPerSecond }) => {
          const convertBatchTime = Convert.date("Y/m/d/H:i:s", batchTime);
          categories.push(convertBatchTime);
          inputRateArr[convertBatchTime] = batchTime;
          return [recordsPerSecond];
        }),
        dataLabels: {
          enabled: false,
        },
      },
    ];
    const spaces = "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0";
    const chart = {
      id: "input-rate-chart",
      chartType: "column",
      chartTitle: { text: "Input Rate" },
      chartSubtitle: {
        text: `Avg: ${Avg} records/sec ${spaces} P75: ${P75} records/sec ${spaces} P95: ${P95} records/sec`,
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
      titleText: "Input Rate",
    };
    const tooltip = {
      formatter: function () {
        return "<b>" + this.y + " records/sec at " + "</b>" + this.x;
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
        inputRateArr: inputRateArr,
      }
    );
  }

  renderCharts(receivers) {
    let receiverArr = [];
    let categories = [];
    this.setState({
      chartPropertys: receivers.map((receiver, index) => {
        const { avgEventRate, eventRateP75, eventRateP95, data } = receiver;
        let Avg = this.handleRecords(avgEventRate);
        let P75 = this.handleRecords(eventRateP75);
        let P95 = this.handleRecords(eventRateP95);
        const series = [
          {
            name: "Input Receivers",
            color: receiver.color || "#0088CC",
            data: data.map(({ eventTime, eventRate }) => {
              const convertBatchTime = Convert.date("Y/m/d/H:i:s", eventTime);
              categories.push(convertBatchTime);
              receiverArr[convertBatchTime] = eventTime;
              return [eventRate];
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
          chartTitle: { text: "Input Receivers" },
          chartSubtitle: {
            text: `Avg: ${Avg} records/sec ${spaces} P75: ${P75} records/sec ${spaces} P95: ${P95} records/sec`,
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
          titleText: "Input Receivers",
        };
        const tooltip = {
          formatter: function () {
            return "<b>" + this.y + " records/sec at " + "</b>" + this.x;
          },
        };
        return new HighChartsProperty(chart, xAxis, series, yAxis, tooltip);
      }),
      receiverArr: receiverArr,
    });
  }

  reload() {
    try {
      const { appData } = this.context;
      const { inputRate, receivers } = new InputRateDataContainer(appData).data;
      this.setState(
        {
          inputRate: inputRate,
          receivers: receivers,
        },
        () => {}
      );
      this.renderChart(inputRate);
      this.renderCharts(receivers);
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
    const { chartProperty, loaded, chartPropertys } = this.state;

    return (
      <div className={c("streaming-inputRate", t.mt4, t.relative)}>
        {!loaded ? (
          <SpinnerLoading />
        ) : !chartProperty ? (
          <div>No task data of the job.</div>
        ) : (
          <div>
            <div id="streaming-input-rate" className={c(t.relative, "streaming-input-rate")}>
              <HighChart
                chartProperty={chartProperty}
                handleChartClick={(e)=> this.handleInputRateChartClick(e, ".streaming-input-rate")}
              />
            </div>

            {chartPropertys &&
              chartPropertys.map((chartProperty, index) => {
                return (
                  <div
                    id={`streaming-receiver-${index}`}
                    className={c(t.relative,  `streaming-receiver-${index}`)}
                    key={index}
                  >
                    <HighChart
                      key={index}
                      chartProperty={chartProperty}
                      handleChartClick={(e)=> this.handleReceiverChartClick(e, `.streaming-receiver-${index}`)}
                    />
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  }
}

InputRate.contextType = AppData;
