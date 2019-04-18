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
import 'chartjs-plugin-datalabels'; // This plugin registers itself globally
import c from 'classnames';
import {range} from 'lodash';
import PropTypes from 'prop-types';
import {Stack, FontClassNames} from 'office-ui-fabric-react';
import React, {useEffect, useRef} from 'react';

import Card from './card';
import {statusColorMapping} from '../../components/theme';

import t from '../../components/tachyons.scss';

const GpuChart = ({className, gpuPerNode}) => {
  const maxVal = Math.max(...Object.values(gpuPerNode));
  const data = Array(maxVal + 1).fill(0);
  for (const key of Object.keys(gpuPerNode)) {
    data[gpuPerNode[key]] += 1;
  }

  const chartRef = useRef(null);

  useEffect(() => {
    new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: range(maxVal + 1),
        datasets: [{
          backgroundColor: statusColorMapping.succeeded,
          label: 'nodeCount',
          data: data,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        tooltips: {
          enabled: false,
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: '#GPU',
            },
            gridLines: {
              display: false,
            },
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: '#Node',
            },
            ticks: {
              max: Math.max(...data) * 1.2,
              display: false,
            },
            gridLines: {
              display: false,
            },
          }],
        },
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'end',
          },
        },
      },
    });
  });

  return (
    <Card className={className}>
      <Stack styles={{root: [t.h100]}} gap='l1'>
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
  className: PropTypes.string,
  gpuPerNode: PropTypes.object.isRequired,
};

export default GpuChart;
