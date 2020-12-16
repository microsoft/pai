import "office-ui-fabric-react/dist/css/fabric.css";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import React from "react";
import Convert from "../../../models/utils/convert-utils";
import { compact } from "lodash";
import { HandlerChartInfo } from "../../../components/common/highcharts/utils";
import * as Highcharts from "highcharts";
import HighchartsSankey from "highcharts/modules/sankey";
import HighchartsOrganization from "highcharts/modules/organization";
import HighchartsExporting from "highcharts/modules/exporting";
HighchartsSankey(Highcharts);
HighchartsOrganization(Highcharts);
HighchartsExporting(Highcharts);

export default class JobGraphDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      job: props.job,
      jobId: props.jobId,
      batchTimeId: props.batchTimeId,
      callbackChangeTab: props.callbackChangeTab,
      rootStyle: {
        backgroundColor: {
          PENDING: "#fff",
          ACTIVE: "#0071BC",
          SKIPPED: "#B1B5B8",
          COMPLETE: "#7FBA00",
          FAILED: "#E81123",
        },
      },
    };
    this.reload = this.reload.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.renderVcoreChart = this.renderVcoreChart.bind(this);
    this.setChartData = this.setChartData.bind(this);
  }

  handleClick({ id, title }) {
    const { batchTimeId, jobId } = this.props;
    const [status, isDataMissing] = title.split("|");
    status == "PENDING" || status == "SKIPPED" || isDataMissing == "true"
      ? ""
      : this.state.callbackChangeTab(
          "batchleveldebug-stages",
          batchTimeId,
          jobId,
          id,
          -1
        );
  }

  componentDidMount() {
    void this.reload();
  }

  componentDidUpdate(prevProps) {
    if (this.props.job != prevProps.job) {
      this.setChartData();
    }
  }

  setChartData() {
    const {
      job: { stages, stageId2InEdges },
      jobId,
    } = this.props;
    const {
      handleClick,
      state: { rootStyle },
    } = this;
    const info = new HandlerChartInfo(stageId2InEdges, stages, rootStyle);
    const { width, height } = info.calculateChartSize();
    // 1. get nodes info.
    // 2. get edges info.
    const nodes = info.getStagesNodes();
    const data = info.getData();
    this.renderVcoreChart(jobId, width, height, nodes, data, handleClick);
  }

  reload() {
    try {
      this.setChartData();
    } catch (error) {
      return "Get error when fetch job data from Spark history server";
    }
  }

  renderVcoreChart(jobId, width, height, nodes, data, handleClick) {
    Highcharts.chart(`container${jobId}`, {
      chart: {
        width: width * 200,
        height: 60 + height * 138,
        backgroundColor: "#ECF0F5",
        inverted: true,
      },
      credits: {
        enabled: false,
      },
      navigation: {
        buttonOptions: {
          enabled: false,
        },
      },
      title: {
        text: "Job" + jobId,
      },
      plotOptions: {
        series: {
          events: {
            click: function ({ point: { id, title } }) {
              handleClick({ id: id, title: title });
            },
          },
        },
      },
      series: [
        {
          type: "organization",
          name: "Highsoft",
          keys: ["from", "to", "weight"],
          data,
          nodes,
          colorByPoint: false,
          color: "#007ad0",
          dataLabels: {
            color: "black",
            style: {
              fontSize: "14px",
              fontWeight: 600,
            },
          },
          borderColor: "white",
          nodeWidth: 118,
        },
      ],
      tooltip: {
        enabled: false,
      },
      exporting: {
        allowHTML: true,
        sourceWidth: 800,
        sourceHeight: 600,
      },
    });
  }

  render() {
    const { jobId } = this.props;
    try {
      return <div id={`container${jobId}`}></div>;
    } catch (e) {
      console.log(e);
      return "Get error when fetch job data from Spark history server";
    }
  }
}
