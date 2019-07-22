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

import d3 from 'd3';
import c from 'classnames';
import {isNil, range} from 'lodash';
import PropTypes from 'prop-types';
import {Stack, FontClassNames} from 'office-ui-fabric-react';
import React, {useEffect, useRef, useMemo} from 'react';

import Card from './card';

import t from '../../components/tachyons.scss';
import {getVirtualClusterColor} from './util';

const GpuChart = ({style, gpuPerNode, virtualClusters}) => {

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
          backgroundColor: getVirtualClusterColor(name, vc),
          hoverBackgroundColor: getVirtualClusterColor(name, vc),
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
    result.unshift({
      backgroundColor: getVirtualClusterColor(),
      hoverBackgroundColor: getVirtualClusterColor(),
      label: 'shared_vc',
      data: data,
    });
    return result;
  }, [virtualClusters, gpuPerNode]);

  const stackedData = dataset.reduce((prev, x) => {
    for (let i = 0; i < maxVal; i++) {
      if (x.data[i]) {
        prev[i] += x.data[i];
      }
    }
    return prev;
  }, Array(maxVal).fill(0));
  const height = Math.max(...stackedData);

  const svgRef = useRef(null);

  useEffect(() => {
    function redraw() {
      if (isNil(svgRef.current)) {
        return;
      }
      // width & height
      const svg = d3.select(svgRef.current);
      const container = d3.select(svg.node().parentNode);
      const width = container.clientWidth;
      const height = container.clientHeight;
      svg
        .attr('width', width)
        .attr('height', height);
      // data
      const maxGpu = Math.max(...Object.values(gpuPerNode));

      // axis
      const x = d3.scaleBand()
        .domain(range(1, maxGpu))
        .range([0, width])
        .paddingInner(32)
        .paddingOuter(32)
        .round(true);
      const xAxis = axisBottom(x)
        .tickFormat((x) => `Node with ${x}GPU`);
      const y = d3.scaleLinear()
        .domain()
        .range([0, height])
      const series = d3
    }

    redraw();
    window.addEventListener('resize', redraw);
    return () => {
      window.removeEventListener('resize', redraw);
    };
  }, [gpuPerNode, virtualClusters]);

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
            <svg ref={svgRef}></svg>
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
