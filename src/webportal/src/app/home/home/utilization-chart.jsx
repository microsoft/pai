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

import c3 from 'c3';
import * as d3 from 'd3';
import c from 'classnames';
import PropTypes from 'prop-types';
import { Stack, getTheme } from 'office-ui-fabric-react';
import React, { useEffect, useRef } from 'react';

import './c3.scss';
import t from '../../components/tachyons.scss';

export const UtilizationChart = ({ percentage }) => {
  const { palette } = getTheme();
  const chartRef = useRef(null);

  let usageColor = palette.green;
  if (percentage > 0.5 && percentage <= 0.9) {
    usageColor = palette.yellow;
  }
  if (percentage > 0.9) {
    usageColor = palette.red;
  }

  useEffect(() => {
    const chart = c3.generate({
      size: {
        width: 100,
        height: 100,
      },
      bindto: chartRef.current,
      data: {
        columns: [
          ['usedResouce', percentage],
          ['unsedResouces', 1 - percentage],
        ],
        type: 'donut',
        order: null,
      },
      color: {
        pattern: [usageColor, palette.neutralLight],
      },
      padding: {
        bottom: 0,
      },
      transition: {
        duration: 0,
      },
      donut: {
        label: {
          show: false,
        },
        title: `${d3.format('.2f')(percentage * 100)}%`,
        expand: false,
        width: 8,
      },
      legend: {
        show: false,
      },
      tooltip: {
        show: false,
      },
      onrendered: () => {
        const d3Donuts = d3.selectAll('.c3-chart-arcs').nodes();
        d3Donuts.forEach(node => {
          // TODO: hardcode here, change it when has better solution
          node.setAttribute('transform', 'translate(' + 45 + ',' + 43 + ')');
        });
      },
    });
    chart.resize();
  }, []);

  return (
    <Stack styles={{ root: [t.relative] }} grow>
      <div className={c(t.absolute, t.absoluteFill)}>
        <div className={c(t.h100, t.w100)} ref={chartRef} />
      </div>
    </Stack>
  );
};

UtilizationChart.propTypes = {
  percentage: PropTypes.number.isRequired,
};
