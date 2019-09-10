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
import c from 'classnames';
import { isNil, merge } from 'lodash';
import PropTypes from 'prop-types';
import {
  Stack,
  FontClassNames,
  getTheme,
  FontWeights,
  TooltipHost,
  DirectionalHint,
} from 'office-ui-fabric-react';
import React, { useEffect, useRef, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MediaQuery from 'react-responsive';

import Card from '../../components/card';

import './c3.scss';
import t from '../../components/tachyons.scss';
import {
  SHARED_VC_COLOR,
  DEDICATED_VC_COLOR,
  BREAKPOINT1,
  BREAKPOINT2,
} from './util';

const GpuChart = ({ style, gpuPerNode, virtualClusters, userInfo }) => {
  const chartRef = useRef(null);
  const { palette, spacing } = getTheme();

  const hasDedicatedVC = useMemo(() => {
    return Object.entries(virtualClusters)
      .filter(([name, info]) => userInfo.virtualCluster.includes(name))
      .some(([name, info]) => info.dedicated);
  }, [userInfo, virtualClusters]);

  useEffect(() => {
    if (isNil(chartRef.current)) {
      return;
    }
    // data
    const maxGpu = Math.max(...Object.values(gpuPerNode));
    const processed = {};
    const stack = [];
    const shared = Array.from({ length: maxGpu + 1 }, () => 0);
    const dedicated = {};
    // data - dedicated
    for (const [name, vc] of Object.entries(virtualClusters)) {
      if (vc.dedicated && vc.nodeList) {
        if (!userInfo.virtualCluster.includes(name)) {
          for (const node of vc.nodeList) {
            processed[node] = true;
          }
        } else {
          const data = Array.from({ length: maxGpu + 1 }, () => 0);
          for (const node of vc.nodeList) {
            data[gpuPerNode[node]] += 1;
            processed[node] = true;
          }
          dedicated[name] = data;
        }
      }
    }
    // data - shared
    for (const key of Object.keys(gpuPerNode)) {
      if (!processed[key]) {
        shared[gpuPerNode[key]] += 1;
      }
    }
    // data - stack
    stack[0] = ['shared', ...shared.slice(1)];
    stack[1] = Object.values(dedicated).reduce((prev, val) => {
      for (let i = 0; i <= maxGpu; i += 1) {
        prev[i] += val[i];
      }
      return prev;
    }, Array.from({ length: maxGpu + 1 }, () => 0));
    stack[1][0] = 'dedicated';

    // c3 option
    const defaultOption = {
      bindto: chartRef.current,
      data: {
        columns: stack,
        type: 'bar',
        groups: [['shared', 'dedicated']],
        labels: {
          format: x => (x === 0 ? '' : x),
        },
      },
      padding: {
        left: 20,
        bottom: 0,
      },
      transition: {
        duration: 0,
      },
      axis: {
        x: {
          tick: {
            outer: false,
            format: x => `Node with ${x + 1}GPU`,
            multiline: true,
            multilineMax: 3,
          },
        },
        y: {
          label: {
            text: 'Available #',
            position: 'outer-middle',
          },
          tick: {
            outer: false,
            values: [],
          },
          inner: true,
        },
      },
      legend: {
        show: false,
      },
      bar: {
        width: {
          ratio: 0.4,
        },
      },
      tooltip: {
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          return renderToStaticMarkup(
            <Card
              className={c(t.z5)}
              style={{
                backgroundColor: palette.neutralLight,
                padding: spacing.s1,
              }}
            >
              <Stack gap='s2'>
                {d[0].value > 0 && (
                  <Stack horizontal gap='s1' verticalAlign='center'>
                    <div
                      style={{
                        width: 20,
                        height: 16,
                        backgroundColor: SHARED_VC_COLOR,
                      }}
                    ></div>
                    <div>Available nodes in shared VC:</div>
                    <div style={{ fontWeight: FontWeights.semibold }}>
                      {d[0].value}
                    </div>
                  </Stack>
                )}
                {d[1].value > 0 && (
                  <Stack gap='s2'>
                    <Stack horizontal gap='s1' verticalAlign='center'>
                      <div
                        style={{
                          width: 20,
                          height: 16,
                          backgroundColor: DEDICATED_VC_COLOR,
                        }}
                      ></div>
                      <div>Available nodes in dedicated VC:</div>
                      <div style={{ fontWeight: FontWeights.semibold }}>
                        {d[1].value}
                      </div>
                    </Stack>
                    {Object.entries(dedicated).map(([name, info]) => (
                      <Stack
                        key={`dedicated-${name}`}
                        horizontal
                        gap='s1'
                        padding='0 l2'
                        verticalAlign='center'
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: DEDICATED_VC_COLOR,
                          }}
                        ></div>
                        <div>{`${name}:`}</div>
                        <div>{info[d[0].x + 1]}</div>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>,
          );
        },
      },
      color: {
        pattern: [SHARED_VC_COLOR, DEDICATED_VC_COLOR],
      },
      onresize: () => {
        // workaround for https://github.com/c3js/c3/issues/1450
        chartRef.current.style.maxHeight = '';
      },
    };

    // c3 draw
    const getSmallFlag = () => chartRef.current.clientWidth < 420;
    let smallFlag = getSmallFlag();
    function draw() {
      const twoLine = {
        padding: {
          bottom: 8,
        },
        axis: {
          x: {
            tick: {
              width: 80,
            },
          },
        },
      };
      const threeLine = {
        padding: {
          bottom: 20,
        },
        axis: {
          x: {
            tick: {
              width: 40,
            },
          },
        },
      };

      let opt;
      if (smallFlag) {
        if (maxGpu > 4) {
          opt = merge({}, defaultOption, threeLine);
        } else {
          opt = merge({}, defaultOption, twoLine);
        }
      } else {
        if (maxGpu > 4) {
          opt = merge({}, defaultOption, twoLine);
        } else {
          opt = merge({}, defaultOption);
        }
      }

      const chart = c3.generate(opt);
      chart.resize();
      return chart;
    }
    draw();

    function onResize() {
      const newFlag = getSmallFlag();
      if (newFlag !== smallFlag) {
        smallFlag = newFlag;
        draw();
      }
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [gpuPerNode, userInfo, virtualClusters]);

  return (
    <Card className={t.ph5} style={style}>
      <Stack styles={{ root: [{ height: '100%' }] }} gap='l1'>
        <Stack.Item>
          <Stack horizontal horizontalAlign='space-between'>
            <div className={FontClassNames.mediumPlus}>Available GPU nodes</div>
            <div>
              {hasDedicatedVC && (
                <div>
                  {/* large */}
                  <MediaQuery maxWidth={BREAKPOINT1}>
                    <Stack gap='s2'>
                      <Stack horizontal gap='s1' verticalAlign='center'>
                        <div
                          style={{
                            width: 20,
                            height: 16,
                            backgroundColor: SHARED_VC_COLOR,
                          }}
                        ></div>
                        <div>Available nodes in shared VC</div>
                      </Stack>
                      <Stack horizontal gap='s1' verticalAlign='center'>
                        <div
                          style={{
                            width: 20,
                            height: 16,
                            backgroundColor: DEDICATED_VC_COLOR,
                          }}
                        ></div>
                        <div>Available nodes in dedicated VC</div>
                      </Stack>
                    </Stack>
                  </MediaQuery>
                  {/* large */}
                  <MediaQuery minWidth={BREAKPOINT2}>
                    <Stack gap='s2'>
                      <Stack horizontal gap='s1' verticalAlign='center'>
                        <div
                          style={{
                            width: 20,
                            height: 16,
                            backgroundColor: SHARED_VC_COLOR,
                          }}
                        ></div>
                        <div>Available nodes in shared VC</div>
                      </Stack>
                      <Stack horizontal gap='s1' verticalAlign='center'>
                        <div
                          style={{
                            width: 20,
                            height: 16,
                            backgroundColor: DEDICATED_VC_COLOR,
                          }}
                        ></div>
                        <div>Available nodes in dedicated VC</div>
                      </Stack>
                    </Stack>
                  </MediaQuery>
                  {/* small */}
                  <MediaQuery
                    minWidth={BREAKPOINT1 + 1}
                    maxWidth={BREAKPOINT2 - 1}
                  >
                    <Stack gap='s2'>
                      <TooltipHost
                        calloutProps={{
                          isBeakVisible: false,
                        }}
                        delay={0}
                        directionalHint={DirectionalHint.leftCenter}
                        tooltipProps={{
                          styles: {
                            root: [
                              {
                                padding: 0,
                                border: 0,
                                boxShadow: 'none',
                                animation: 'none',
                              },
                            ],
                          },
                          onRenderContent: () => (
                            <Card
                              className={c(t.z5, FontClassNames.medium)}
                              style={{
                                backgroundColor: palette.neutralLight,
                                padding: spacing.s1,
                              }}
                            >
                              Available nodes in shared VC
                            </Card>
                          ),
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 16,
                            backgroundColor: SHARED_VC_COLOR,
                          }}
                        ></div>
                      </TooltipHost>
                      <TooltipHost
                        calloutProps={{
                          isBeakVisible: false,
                        }}
                        delay={0}
                        directionalHint={DirectionalHint.leftCenter}
                        tooltipProps={{
                          styles: {
                            root: [
                              {
                                padding: 0,
                                border: 0,
                                boxShadow: 'none',
                                animation: 'none',
                              },
                            ],
                          },
                          onRenderContent: () => (
                            <Card
                              className={c(t.z5, FontClassNames.medium)}
                              style={{
                                backgroundColor: palette.neutralLight,
                                padding: spacing.s1,
                              }}
                            >
                              Available nodes in dedicated VC
                            </Card>
                          ),
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 16,
                            backgroundColor: DEDICATED_VC_COLOR,
                          }}
                        ></div>
                      </TooltipHost>
                    </Stack>
                  </MediaQuery>
                </div>
              )}
            </div>
          </Stack>
        </Stack.Item>
        <Stack.Item styles={{ root: [t.relative] }} grow>
          <div className={c(t.absolute, t.absoluteFill)}>
            <div className={c(t.h100, t.w100)} ref={chartRef}></div>
          </div>
        </Stack.Item>
      </Stack>
    </Card>
  );
};

GpuChart.propTypes = {
  style: PropTypes.object,
  userInfo: PropTypes.object.isRequired,
  gpuPerNode: PropTypes.object.isRequired,
  virtualClusters: PropTypes.object.isRequired,
};

export default GpuChart;
