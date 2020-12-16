"use strict";

import HighChart from "./Highcharts";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { cloneDeep, intersection } from "lodash";
import Convert from "../../../models/utils/convert-utils";
const { Highcharts } = HighChart;
export function handlechartHoverEvent(Container) {
  // Allows the crosshair lines of multiple charts to be linked, where mouse events bound to the dom attachment of multiple charts are linked.
  $(Container).bind("mousemove", function (e) {
    for (let i = 0; i < Highcharts.charts.length; i = i + 1) {
      const chart = Highcharts.charts[i];
      const event = chart.pointer.normalize(e.originalEvent);
      const point = chart.series[0].searchPoint(event, true);
      if (point) {
        point.highlight(e);
      }
    }
  });
  // Override the internal method by turning off the hidden function that prompts the crosshair.
  Highcharts.Pointer.prototype.reset = function () {
    return undefined;
  };
  // Highlight the current data point and set the mouse sliding state and draw crosshair line.
  Highcharts.Point.prototype.highlight = function (event) {
    // this.series.chart.tooltip.refresh(this);
    // this.series.chart.yAxis[0].drawCrosshair(event);
    this.onMouseOver();
  };
}

export function syncExtremes(e) {
  var thisChart = this.chart;
  if (e.trigger !== "syncExtremes") {
    Highcharts.each(Highcharts.charts, function (chart) {
      if (chart !== thisChart) {
        if (chart.xAxis[0].setExtremes) {
          chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
            trigger: "syncExtremes",
          });
        }
      }
    });
  }
}

export class HandlerChartInfo {
  constructor(edges, stages, rootStyle) {
    this.edges = edges;
    this.stages = stages;
    this.rootStyle = rootStyle;
    this.data = [];
    this.getStageIds = this.getStageIds.bind(this);
  }

  calculateChartSize() {
    const stageId2InEdges = this.edges;
    // Construct reverse DAG
    let reverseEdges = new Map();
    for (let [stageId, childStageIds] of stageId2InEdges) {
      for (let childStageId of childStageIds) {
        if (reverseEdges.has(childStageId)) {
          reverseEdges.get(childStageId).push(stageId);
        } else {
          reverseEdges.set(childStageId, [stageId]);
        }
      }
    }
    // height here is (the distance to BOTTOM + 1)
    let heightMap = new Map(); // {stageId: height};
    // DP + recursive here
    function calculateHeight(stageId) {
      if (!heightMap.has(stageId)) {
        let parentStageIds = reverseEdges.get(stageId);
        if (parentStageIds === undefined || parentStageIds.length === 0) {
          heightMap.set(stageId, 1);
        } else {
          let parentHeights = parentStageIds.map((stageId) =>
            calculateHeight(stageId)
          );
          heightMap.set(stageId, Math.max(...parentHeights) + 1);
        }
      }
      return heightMap.get(stageId);
    }
    for (let stageId of stageId2InEdges.keys()) {
      calculateHeight(stageId);
    }
    let maxHeight = Math.max(...heightMap.values());
    // Grouping by height to calculate width
    let heightCount = new Map();
    for (let height of heightMap.values()) {
      if (!heightCount.has(height)) {
        heightCount.set(height, 0);
      }
      heightCount.set(height, heightCount.get(height) + 1);
    }
    let maxWidth = Math.max(...heightCount.values());
    return {
      height: maxHeight,
      width: maxWidth,
    };
  }

  getRootStageId(stageId2InEdges) {
    let nonRootStageIds = new Set();
    for (let childStageIds of stageId2InEdges.values()) {
      for (let childStageId of childStageIds) {
        nonRootStageIds.add(childStageId);
      }
    }
    for (let stageId of stageId2InEdges.keys()) {
      if (!nonRootStageIds.has(stageId)) {
        return stageId;
      }
    }
    return null;
  }

  getStageIds(id, edges) {
    let allStageId = [];
    let stageIdArr = edges.get(id);
    allStageId.push(stageIdArr);
    if (Array.isArray(stageIdArr)) {
      for (let i = 0; i < stageIdArr.length; i++) {
        const id = stageIdArr[i];
        allStageId.push(...this.getStageIds(id, edges));
      }
    }
    return allStageId;
  }

  delIntersection(stages) {
    const newStages = [
      ...new Set(
        stages.filter((s) => s.length > 0).map((stage) => stage.toString())
      ),
    ]
      .map((s) => s.split(","))
      .map((s) => s.map((s) => s * 1))
      .sort();
    return newStages;
  }

  getStagesNodes() {
    const {
      getRootStageId,
      edges,
      stages,
      renderElement,
      rootStyle,
      getStageIds,
      delIntersection,
    } = this;
    const toTreeStages = [];
    const rootStageId = getRootStageId(edges);
    let stageIdsArr = getStageIds(rootStageId, edges);
    let filterStages = delIntersection(stageIdsArr);

    const toTreeNodes = [[rootStageId]].concat(filterStages).reverse();
    toTreeNodes.forEach((nodes, i) => {
      nodes.forEach((n) => {
        const filteredStage = stages.find((s) => s.stageId === n);
        if (filteredStage) {
          const lastAttempt = filteredStage.getLastAttempt();
          toTreeStages.push({
            id: lastAttempt.stageId,
            name: lastAttempt.name,
            color: rootStyle.backgroundColor[lastAttempt.status],
            title: lastAttempt.status + "|" + lastAttempt.isDataMissing,
            dataLabels: {
              nodeFormat: renderElement(filteredStage),
            },
          });
        } else {
          toTreeStages.push({
            id: n,
            color: rootStyle.backgroundColor["SKIPPED"],
          });
        }
      });
    });

    return toTreeStages;
  }

  getData() {
    const data = [];
    for (let [key, value] of this.edges) {
      if (value.length > 0) {
        value.forEach((element) => data.push([element, key])); // there is a edge element -> key
      } else {
        data.push([key, key]);
      }
    }
    return this.data = data.sort((a, b) => a[a.length - 1] - b[b.length - 1]);
  }

  getAllLeafNumber() {
    const leaves = this.data.filter((d)=> d[0] === d[1]);
    return leaves.length;
  }

  renderElement(stage) {
    const {
      stageId,
      status,
      name,
      tasks,
      inputBytes,
      duration,
      outputBytes,
      inputRecords,
      attemptId,
      isDataMissing,
      hasError,
      hasSkew,
    } = stage.getLastAttempt();
    return `
<div
  id=stage${stageId}
  class=${c(`stage${stageId}`, t.flex, t.flexColumn, t.itemsCenter)}
  key=${stageId}
  style="cursor: ${status == "PENDING" || status == "SKIPPED" ? "no-drop" : ""}"
>
  <div class=${c(t.overflowHidden)}>
    <div style="float: left">Stage ${stageId}</div>
    <div class=${c(t.flex, t.itemsCenter)} style="float: right; display: ${
      status === "FAILED" || !hasError ? "none" : ""
    }">
      <svg class="icon warning16" aria-hidden="true"">
        <use xlink:href="#icon-warning16"></use>
      </svg>
    </div>
    <div class=${c(t.flex, t.itemsCenter)} style="float: right; display: ${
      hasSkew ? "" : "none"
    }">
      <svg class="icon warning5" aria-hidden="true"">
        <use xlink:href="#icon-warning5"></use>
      </svg>
    </div>
  </div>
  <div class=${c(t.truncate)} title=${name.replace(
      / /g,
      "&#32;"
    )} style= "margin-top: ${
      (status !== "FAILED" && hasError) || hasSkew ? "" : "10px"
    }">${name}</div>
  <div style="display: ${isDataMissing ? "none" : ""}"}>
    <div style=" overflow: hidden, textOverflow: ellipsis ">
      <span class=${c(t.nowrap)}>
        Total Duration: ${Convert.formatDuration(stage.totalDuration)}
      </span>
    </div>
    <div style=" overflow: hidden, textOverflow: ellipsis " class=${c(t.flex)}>
      <span class=${c(t.w50, t.nowrap)}>${Convert.formatNumber(
      tasks.length,
      true,
      0
    )} tasks</span>
      <span class=${c(t.w50, t.nowrap)}>R: ${Convert.formatBytes(
      inputBytes,
      "display",
      0
    )}</span>
    </div>
    <div style=" overflow: hidden, textOverflow: ellipsis " class=${c(t.flex)}>
      <div class=${c(t.w50, t.nowrap)}>${Convert.formatDuration(duration)}</div>
      <div class=${c(t.w50, t.nowrap)}>W: ${Convert.formatBytes(
      outputBytes,
      "display",
      0
    )}</div>
    </div>
    <div class=${c(t.flex)}>
      <span class=${c(t.w50, t.nowrap)}>${Convert.formatNumber(
      inputRecords,
      true,
      0
    )} Rows</span>
      <span class=${c(t.w50, t.nowrap)}>Retry: ${
      stage.attempts.length - 1
    }</span>
    </div>
  </div>
</div > `;
  }
}
