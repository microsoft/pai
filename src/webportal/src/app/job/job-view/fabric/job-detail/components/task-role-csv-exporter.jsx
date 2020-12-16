// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { capitalize, isNil } from 'lodash';
import { DateTime, Interval } from 'luxon';
import { getDurationString } from '../../../../../components/util/job';

function exportToCsv(filename, rows) {
  var csvFile = rows.join('\n');
  var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement('a');
    if (link.download !== undefined) {
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function getPortsString(ports) {
  if (isNil(ports)) {
    return null;
  }

  return Object.entries(ports)
    .map(([key, val]) => `${key}: ${val}`)
    .join(' ');
}

function getTimeDuration(startMs, endMs) {
  const start = startMs && DateTime.fromMillis(startMs);
  const end = endMs && DateTime.fromMillis(endMs);
  if (start) {
    return Interval.fromDateTimes(start, end || DateTime.utc()).toDuration([
      'days',
      'hours',
      'minutes',
      'seconds',
    ]);
  } else {
    return 'null';
  }
}

export default class TaskRoleCsvExporter {
  apply(taskRoleName, items) {
    const columns = [
      'Task Index',
      'Task State',
      'Task Retries',
      'IP',
      'Ports',
      'Exit Type',
      'Exit Code',
      'Running Start Time',
      'Running Duration',
      'Node Name',
      'Container ID',
    ];
    const rows = [columns.join(',')];

    for (const item of items) {
      const cols = [
        item.taskIndex,
        capitalize(item.taskState),
        item.retries,
        !isNil(item.containerIp) ? item.containerIp : 'N/A',
        getPortsString(item.containerPorts),
        !isNil(item.containerExitSpec) && !isNil(item.containerExitSpec.type)
          ? item.containerExitSpec.type
          : 'null',
        isNil(item.containerExitSpec)
          ? item.containerExitCode
          : `${item.containerExitCode} (${item.containerExitSpec.phrase})`,
        isNil(item.launchedTime)
          ? 'null'
          : `"${DateTime.fromMillis(item.launchedTime).toLocaleString(
              DateTime.DATETIME_MED_WITH_SECONDS,
            )}"`,
        getDurationString(
          getTimeDuration(item.launchedTime, item.completedTime),
        ),
        item.containerNodeName,
        item.containerId,
      ];

      rows.push(cols.join(','));
    }

    exportToCsv(taskRoleName, rows);
  }
}
