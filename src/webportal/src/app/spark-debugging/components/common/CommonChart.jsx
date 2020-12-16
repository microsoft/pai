import React, { useEffect, useState, useMemo } from 'react';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { PrimaryButton } from 'office-ui-fabric-react';
import Chart from 'chart.js';
import 'chartjs-plugin-zoom';
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';

import Convert from '../../models/utils/convert-utils';

function CommonChart(props) {

    const {
        datasets,
        chartType, 
        arguments: {
            scaleLabel: {xMax, yMax, xMin, yMin, xUnitName, yUnitName}, 
            style: {canvasId, w, h}, 
            labels, 
            hoverText,
            zoom: {enabled, drag, mode, speed}
    }} = props;

    const [myChart, setMyChart] = useState();
    const [isPan, setIsPan] = useState(false);

    useEffect(()=> {
        if (datasets) {
        try {
            const ctx = document.getElementById(canvasId).getContext('2d');
            setMyChart(new Chart(ctx, {
                type: chartType,
                data: {
                        datasets,
                        labels: labels
                    },
                options: {
                        tooltips: {
                            callbacks: {
                                beforeLabel: function(e){
                                return hoverText + e.index;
                                }
                            }
                        },
                        // maintainAspectRatio: true,
                        title: {
                            display: true,
                        },   
                scales: {
                    xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: xUnitName
                    },
                    ticks: {
                        min: xMin,
                    }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: yUnitName
                        },
                        ticks: {
                            min: yMin,
                        }
                    }]
                },
                pan: {
                    enabled: isPan,
                    mode: 'xy'
                },
                zoom: {
                    enabled,
                    drag,
                    mode,
                    speed
                }
                }
            }));
        } catch (error) {
            console.log(error);
        }
        }
    }, [datasets, isPan]);

    function reset() {
    myChart.resetZoom();
    }

    function _onChange() {
        setIsPan(!isPan);
    }

    return (
        <div className= {c(t.mt3)}>
            <div style= {{margin: '0 auto', width: w, height: h}}>
            <div className= {c(t.flex, t.itemsCenter)}>
                <div className= {c(t.mr6, t.ml2)}><PrimaryButton onClick= {reset} text= 'rest' /></div>
                <div className= {c(t.mt3)}><Toggle label="" onChange={_onChange} /></div>
                <span>Enabled pan</span>
                </div>
            <canvas id={canvasId} style= {{width: w, height: h}}></canvas>
        </div>
        </div>
    )
}

export default CommonChart;