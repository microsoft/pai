import Convert from "../../../models/utils/convert-utils";
/**
 * @returns {Date}
 */
export function getModified(job) {
  if (!("_modified" in job)) {
    job._modified = new Date(job.completedTime || job.createdTime);
  }
  return job._modified;
}

/**
 * @returns {number}
 */
export function getDuration(job) {
  // if (!('_duration' in job)) {
  //   job._duration = (job.completedTime || Date.now()) - job.createdTime;
  // }
  // return job._duration;
}

function generateStatus(job) {
  if (job.state === "WAITING") {
    if (job.executionType === "START") {
      job._statusText = "Waiting";
      job._statusIndex = 0;
    } else {
      job._statusText = "Stopping";
      job._statusIndex = 2;
    }
  } else if (job.state === "RUNNING") {
    if (job.executionType === "START") {
      job._statusText = "Running";
      job._statusIndex = 1;
    } else {
      job._statusText = "Stopping";
      job._statusIndex = 2;
    }
  } else if (job.state === "SUCCEEDED") {
    job._statusText = "Succeeded";
    job._statusIndex = 3;
  } else if (job.state === "FAILED") {
    job._statusText = "Failed";
    job._statusIndex = 4;
  } else if (job.state === "STOPPED") {
    job._statusText = "Stopped";
    job._statusIndex = 5;
  } else {
    job._statusText = "Unknown";
    job._statusIndex = -1;
  }
}

/**
 * @returns {string}
 */
export function getStatusText(job) {
  if (!("_statusText" in job)) {
    generateStatus(job);
  }
  return job._statusText;
}

/**
 * @returns {number}
 */
export function getStatusIndex(job) {
  if (!("_statusIndex" in job)) {
    generateStatus(job);
  }
  return job._statusIndex;
}

/**
 * set table scroll position
 * @param {*} itemsLenght
 * @param {*} tableClass
 * @param {*} itemsPerPage
 */
export function setTableScrllbar(itemsLenght, tableClass, height, tableW) {
  const table = $(`.content-wrapper ${tableClass} .ms-Viewport`);
  let columnHeaderW =
    $(`.content-wrapper ${tableClass} .ms-Viewport .ms-DetailsHeader`).width() +
    40;
  const tableChild = $(
    `.content-wrapper ${tableClass} .ms-DetailsList-contentWrapper`
  );
  const tableRow = $(`.content-wrapper ${tableClass} .ms-List-cell`);
  const rowH = tableRow.height();
  const list = table.children(".ms-DetailsList");
  const tableH = height
    ? height
    : itemsLenght >= 20
    ? 20 * rowH + 10
    : itemsLenght * rowH;
  list.scrollLeft(0);
  table.css({ "overflow-y": "hidden" });
  list.css({ "overflow-y": "hidden", "overflow-x": "auto" });
  tableChild.css({
    width: tableW,
    height: tableH,
    "overflow-x": "hidden",
    "overflow-y": "auto",
  });
  list.on("scroll", () => {
    columnHeaderW =
      $(
        `.content-wrapper ${tableClass} .ms-Viewport .ms-DetailsHeader`
      ).width() + 40;
    let width = tableW
      ? tableW + list.scrollLeft()
      : table.width() + list.scrollLeft();
    if (width <= columnHeaderW) {
      tableChild.css({
        width: width,
        "overflow-x": "hidden",
        "overflow-y": "auto",
      });
    }
  });
}

/**
 * convert data unit of the table
 * @param {*} item
 */
export function UnitConvert(item) {
  let newItem = {};
  for (const key in item) {
    switch (key) {
      case "LaunchTime":
      case "BatchTime":
        newItem[key] = item[key] === undefined
        ? ""
        : Convert.date("Y/m/d/H:i:s", item[key]);
        break;
      case "GcTime":
      case "Duration":
      case "ExecutorCpuTime":
      case "SchedulerDelay":
      case "SchedulingDelay":
      case "ProcessingTime":
      case "TotalDelay":
        newItem[key] =
          item[key] === undefined
            ? ""
            : Convert.formatDuration(Number(item[key]));
        break;
      case "Input Read Size/Records":
        newItem[key] = `${
          item[key] === undefined
            ? ""
            : Convert.formatBytes(item[key], "display")
        } / ${item.recordsRead}`;
        break;
      case "Output Write Size/Records":
        newItem[key] = `${
          item[key] === undefined
            ? ""
            : Convert.formatBytes(item[key], "display")
        } / ${item.recordsWritten}`;
        break;
      case "Shuffle Read Size/Records":
        newItem[key] = `${
          item[key] === undefined
            ? ""
            : Convert.formatBytes(item[key], "display")
        } / ${item.shuffleRecordsRead}`;
        break;
      case "Shuffle Write Size/Records":
        newItem[key] = `${
          item[key] === undefined
            ? ""
            : Convert.formatBytes(item[key], "display")
        } / ${item.shuffleRecordsWritten}`;
        break;
      case "Task Time(GC Time)":
        newItem[key] =
          Convert.formatDuration(Number(item[key])) +
          "(" +
          Convert.formatDuration(Number(item["GC Time"])) +
          ")";
        break;
      case "Disk Used":
      case "Input":
      case "Shuffle Read":
      case "Shuffle Write":
        newItem[key] = Convert.formatBytes(Number(item[key]), "display");
        break;
      default:
        newItem[key] = item[key];
    }
  }
  return newItem;
}

export function handleDom(isHide) {
  const node1 = $("#content-wrapper .tachyons-mt3--2iFZA");
  const node2 = $(".content-wrapper #content-wrapper .job-detail-topPivot");
  if (isHide) {
    node1.hide();
    node2.hide();
  } else {
    node1.show();
    node2.show();
  }
}

export function convertToLowercase(item) {
  return item.toLowerCase();
}
