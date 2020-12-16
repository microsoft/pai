import React, { useEffect, useState } from "react";
import echarts from "echarts";
import { chartColors, usedOver, usedUnder, overCapacity } from "../theme";

function index(props) {
  const { getChartOption, chartData } = props;
  const { chart, seriesData, tooltip } = chartData;
  const maxScale = 150;
  const Available = seriesData[0] ? seriesData[0].value : 0;
  const utilized = seriesData[1] ? seriesData[1].value : 0;
  
  useEffect(() => {
    var myChart = echarts.init(document.getElementById(chart.id));
    const pieOption = {
      title: {
        text: chart.text,
        left: 8,
        textStyle: {
          fontWeight: 700,
          fontSize: 14,
        },
      },
      tooltip,
      legend: {
        show: !chart.legendShow,
        type: "scroll",
        orient: "vertical",
        right: 0,
        top: 40,
        // bottom: 20,
        icon: "circle",
        padding: 0,
        itemWidth: 16,
        width: 18,
        pageIconSize: 10,
        itemHeight: 17,
      },
      series: [
        {
          name: "",
          type: "pie",
          radius: "75%",
          center: ["35%", "55%"],
          color: chart.chartColors || chartColors,
          label: {
            show: false,
            normal: {
              formatter: "{c}%",
              position: "inside",
              color: chart.color,
            },
          },
          avoidLabelOverlap: true,
          data: seriesData,
          data: seriesData,
        },
      ],
    };

    const gaugeOption = {
      title: {
        text: chart.text,
        left: 8,
        textStyle: {
          fontWeight: 700,
          fontSize: 14,
        },
      },
      tooltip: {
        formatter: utilized + '/' + Available,
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 8,
        top: 50,
        bottom: 20,
        icon: "circle",
        padding: 0,
        itemWidth: 8,
        width: 20,
        pageIconSize: 10,
      },
      series: [
        {
          name: "",
          type: "gauge",
          radius: "75%",
          center: ["35%", "55%"],
          data: [{ value: Available === 0 ? 0 : (utilized * 100 / Available).toFixed(2)}],
          max: maxScale,
          splitNumber: 10,
          animationDuration: 3000,
          startAngle: 210,
          endAngle: -30,
          axisLine: {
            show: true,
            lineStyle: {
              color: [
                [0.53, usedUnder],
                [0.67, usedOver],
                [1, overCapacity],
              ],
              width: 10,
            },
          },
          splitLine: {
            length: 10,
            lineStyle: {
              opacity: 1,
              width: 2,
              shadowColor: "#fff",
            },
          },
          axisTick: {
            splitNumber: 5,
            length: 5,
            lineStyle: {
              color: "#eee",
              opacity: 0.5,
              type: "solid",
              shadowColor: "#fff",
            },
          },
          axisLabel: {
            fontSize: 7,
          },
          detail: {
            offsetCenter: [0, "50%"],
            color: "auto",
            fontSize: 12,
            formatter: "{value}%",
          },
        },
      ],
    };

    if (getChartOption && myChart) {
      getChartOption(myChart);
    }

    myChart.setOption(
      chart.id === "vc-content-overview-chart" ? gaugeOption : pieOption
    );
  }, [chartData]);

  return <div id={chart.id} style={chart.style}></div>;
}

export default index;
