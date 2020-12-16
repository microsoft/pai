import React, { useEffect, useState } from 'react';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { DefaultButton, noWrap } from 'office-ui-fabric-react';
import Chart from 'chart.js';
import 'chartjs-plugin-zoom';
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';

import Convert from '../../../models/utils/convert-utils';

function CommonChart(props) {
    const {
            dataset,
            chartType, 
            axisArguments: {xMax, yMax, xMin, yMin, xUnitName, yUnitName, titleName, onRef}, 
            hoverText,
            chartWidth,
            chartHeight,
            myChartId,
            zoom: {zoomEnabled, drag, zoomMode, speed},
            pan: {panEnabled, panMode},
        } = props.chartProperty;
    
    const [myChart, setMyChart] = useState();

    useEffect(()=> {
        if (dataset) {
        try {
            const ctx = document.getElementById(myChartId).getContext('2d');
            setMyChart(new Chart(ctx, {
                type: chartType,
                data: dataset,
                options: {
                    responsive: true,
                    // showLines: true,
                    tooltips: {
                        callbacks: {
                            beforeLabel: function(e){
                            return hoverText? hoverText + e.index: '';
                            }
                        }
                    },
                    maintainAspectRatio: true,
                    title: {
                        display: true,
                        text: titleName? titleName: ''
                    },   
                    scales: {
                        xAxes: [{
                            maxBarThickness: 20,
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
                        enabled: panEnabled,
                        mode: panMode
                    },
                    zoom: {
                        enabled: zoomEnabled,
                        drag,
                        mode: zoomMode,
                        speed
                    },
                }
            }));
        } catch (error) {
            console.log(error);
        }
        }
    }, [dataset]);
    
    function resetZoom() {
        myChart.resetZoom();
    }
    
    function resetChart() {
        myChart.reset();
    }
    // get resetChart fun
    if(onRef) onRef(resetChart);

    return (
        // <div className= {c(t.mt3)}>
            <div className= 'chart' style= {{margin: '0 auto', width: chartWidth, height: chartHeight, position: 'relative'}}>
                <div style= {{position: 'absolute', top: 10, right: 10}}>
                    <DefaultButton styles= {{root: {background: '#F7F7F7', fontSize: 12, color: '#333', width: 84, height: 34, padding: 0, borderRadius: 3, border: '1px solid #CCC'}}} onClick= {resetZoom} text= 'Reset zoom' />
                </div>
                <canvas id={myChartId} style= {{width: chartWidth, height: chartHeight}}></canvas>
            </div>
        // </div>
    )
}

export default CommonChart;