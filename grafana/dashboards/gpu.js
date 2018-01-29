/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (in the ARGS variable)
 */

'use strict';

// Accessible variables in this scope
// All url parameters are available via the ARGS object
var window, document, ARGS, $, jQuery, moment, kbn;

// Setup some variables
var dashboard;


// Intialize a skeleton with nothing but a rows array and service object
dashboard = {
  rows : [],
};

// Set a title
dashboard.title = 'Utilization of each GPU';

// Set default time
// time can be overriden in the url using from/to parameters, but this is
// handled automatically in grafana core during dashboard initialization
dashboard.time = {
  from: "now-1h",
  to: "now"
};

var gpuNum = 2;

if(!_.isUndefined(ARGS.rows)) {
  gpuNum = parseInt(ARGS.rows, 10);
}
var seriesName = 'argName';

if(!_.isUndefined(ARGS.name)) {
  seriesName = ARGS.name;
}

var hostName = ""
if(!_.isUndefined(ARGS.host)) {
  hostName = ARGS.host;
}

var arrPanels = new Array()
for (var i = 0; i < gpuNum; i++) { 
  arrPanels[i] = {
          "aliasColors": {},
          "bars": false,
          "dashLength": 12,
          "dashes": false,
          "datasource": "PM",
          "fill": 1,
          "id": null,
          "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
          },
          "lines": true,
          "linewidth": 1,
          "links": [],
          "nullPointMode": "null",
          "percentage": false,
          "pointradius": 5,
             "points": false,
          "renderer": "flot",
          "seriesOverrides": [],
          "spaceLength": 10,
          "span": 3,
          "stack": false,
          "steppedLine": false,
          "targets": [
            {
              "expr": "nvidiasmi_utilization_gpu{instance=\"" + hostName+ "\",job=\"node_exporter\",minor_number=\""+ i + "\"}",
              "format": "time_series",
              "intervalFactor": 2,
              "legendFormat": "gpu utilization",
              "refId": "A"
            }
          ],
          "thresholds": [],
          "timeFrom": null,
          "timeShift": null,
          "title": "GPU Utilization " + i,
          "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
          },
          "type": "graph",
          "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
          },
          "yaxes": [
            {
              "format": "short",
              "label": null,
              "logBase": 1,
              "max": null,
              "min": "0",
              "show": true
            },
            {
              "format": "short",
              "label": null,
              "logBase": 1,
              "max": null,
              "min": "0",
              "show": true
            }
          ]
        };
  
}

dashboard.rows.push(
  {
    "collapse": false,
    "panels": arrPanels,
    "repeat": null,
    "repeatIteration": null,
    "repeatRowId": null,
    "showTitle": false,
    "title": "Dashboard Row",
    "titleSize": "h6"
  }
);

dashboard.editable=false;
dashboard.hideControls=true;

return dashboard;

