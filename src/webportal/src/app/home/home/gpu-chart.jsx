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
import React, {useEffect, useRef} from 'react';

import Card from './card';

import t from '../../components/tachyons.scss';
import {getVirtualClusterColor} from './util';

const GpuChart = ({style, gpuPerNode, virtualClusters}) => {
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
      const processed = {};
      const stack = [];
      const shared = Array.from({length: maxGpu + 1}, () => 0);
      const dedicated = {};
      // data - dedicated
      for (const [name, vc] of Object.entries(virtualClusters)) {
        if (vc.dedicated && vc.nodeList) {
          const data = Array.from({length: maxGpu + 1}, () => 0);
          for (const node of vc.nodeList) {
            data[gpuPerNode[node]] += 1;
            processed[node] = true;
          }
          dedicated[name] = data;
        }
      }
      // data - shared
      for (const key of Object.keys(gpuPerNode)) {
        if (!processed[key]) {
          shared[gpuPerNode[key]] += 1;
        }
      }
      // data - stack
      stack[0] = shared;
      stack[1] = Object.values(dedicated).reduce((prev, val) => {
        for (let i = 0; i <= maxGpu; i += 1) {
          prev[i] += val[i];
        }
        return prev;
      }, Array.from({length: maxGpu + 1}, () => 0));
      const maxHeight = Math.max(...Array.from(
        {length: maxGpu + 1},
        (_, idx) => stack[0][idx] + stack[1][idx],
      ));

      // axis
      const x = d3.scaleBand()
        .domain(range(1, maxGpu))
        .range([0, width])
        .paddingInner(32)
        .paddingOuter(32)
        .round(true);
      const xAxis = d3.axisBottom(x)
        .tickFormat((x) => `Node with ${x}GPU`);
      const y = d3.scaleLinear()
        .domain([0, maxHeight])
        .range([0, height]);
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
