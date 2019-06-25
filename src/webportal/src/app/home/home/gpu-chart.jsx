// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import Chart from 'chart.js';
import c from 'classnames';
import {range} from 'lodash';
import PropTypes from 'prop-types';
import {Stack, FontClassNames} from 'office-ui-fabric-react';
import React, {useEffect, useRef, useMemo} from 'react';

import Card from './card';

import t from '../../components/tachyons.scss';
import {getVirtualClusterColor} from './util';

const GpuChart = ({style, gpuPerNode, virtualClusters}) => {
  const maxVal = useMemo(() => {
    return Math.max(...Object.values(gpuPerNode));
  }, [gpuPerNode]);

  const dataset = useMemo(() => {
    const processed = {};
    const result = [];
    // dedicated
    for (const [name, vc] of Object.entries(virtualClusters)) {
      if (vc.dedicated && vc.nodeList) {
        const data = Array(maxVal).fill(0);
        for (const node of vc.nodeList) {
          if (gpuPerNode[node] > 0) {
            data[gpuPerNode[node] - 1] += 1;
            processed[node] = true;
          }
        }
        result.push({
          backgroundColor: getVirtualClusterColor(vc),
          label: `${name} (dedicated)`,
          data: data,
        });
      }
    }
    // shared_vc
    const data = Array(maxVal).fill(0);
    for (const key of Object.keys(gpuPerNode)) {
      if (gpuPerNode[key] > 0 && !processed[key]) {
        data[gpuPerNode[key] - 1] += 1;
      }
    }
    result.push({
      backgroundColor: getVirtualClusterColor(),
      label: 'shared_vc',
      data: data,
    });
    return result;
  }, [virtualClusters, gpuPerNode]);

  const chartRef = useRef(null);

  useEffect(() => {
    new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: range(1, maxVal + 1),
        datasets: dataset,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        tooltips: {
          enabled: true,
          position: 'nearest',
          callbacks: {
            title: (item, data) => (
              `#GPU: ${item[0].label}`
            ),
          },
        },
        scales: {
          xAxes: [{
            stacked: true,
            scaleLabel: {
              display: true,
              labelString: '#GPU',
            },
            gridLines: {
              display: false,
            },
          }],
          yAxes: [{
            stacked: true,
            scaleLabel: {
              display: true,
              labelString: '#Node',
            },
            ticks: {
              max: Math.max(...dataset.map((x) => Math.max(...x.data))) + 1,
              display: true,
              precision: 0,
            },
            gridLines: {
              display: true,
            },
          }],
        },
      },
    });
  });

  return (
    <Card style={style}>
      <Stack styles={{root: [{height: '100%'}]}} gap='l1'>
        <Stack.Item>
          <div className={FontClassNames.mediumPlus}>
            Available GPU nodes
          </div>
        </Stack.Item>
        <Stack.Item styles={{root: [t.relative]}} grow>
          <div className={c(t.absolute, t.absoluteFill)}>
            <canvas ref={chartRef}></canvas>
          </div>
        </Stack.Item>
      </Stack>
    </Card>
  );
};

GpuChart.propTypes = {
  style: PropTypes.object,
  gpuPerNode: PropTypes.object.isRequired,
  virtualClusters: PropTypes.object.isRequired,
};

export default GpuChart;
