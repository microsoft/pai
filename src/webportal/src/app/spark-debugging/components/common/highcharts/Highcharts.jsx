import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts/highstock';
require('highcharts/highcharts-more')(Highcharts);
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';

function HighChart(props) {
        const {
            chartProperty: {
                chart,
                xAxis,
                series,
                yAxis,
                tooltip,
                chartSubtitle,
            },
            handleChartClick,
        } = props;
    const [charts, setCharts] = useState(false);
    
    useEffect(()=> {
        try {
            if (series) {
                setCharts(Highcharts.chart(chart.id, 
                    {
                        chart: {
                            type: chart.chartType,
                            inverted: chart.inverted,
                            backgroundColor: '#FFF',
                            zoomType: 'xy',
                            panning: true,
                            panKey: 'shift',
                            events: {
                                selection: function(e) {
                                    e.resetSelection && e.resetSelection !== ''? isShowBar('none'): isShowBar('');
                                }
                            },
                            marginLeft: chart.marginLeft,
                            spacingTop: chart.spacingTop,
                            spacingBottom: chart.spacingBottom,
                        },
                        credits: {
                            enabled: false
                        },
                        accessibility: {
                            description: ''
                        },
                        title: chart.chartTitle,
                        subtitle: chart.chartSubtitle || chartSubtitle,
                        xAxis: {
                            type: xAxis.type,
                            max: xAxis.max,
                            tickInterval: xAxis.tickInterval,
                            crosshair: xAxis.crosshair,
                            events: xAxis.events,
                            title: {
                                text: xAxis.titleText
                            },
                            scrollbar: {
                                enabled: true,
                            },
                            categories: xAxis.categories,
                            labels: xAxis.labels? xAxis.labels: xAxis,
                            rotation: xAxis.rotation,
                            tickPixelInterval: xAxis.tickPixelInterval,
                            startOnTick: xAxis.startOnTick,
                        },
                        yAxis: {
                            max: yAxis.max,
                            min: yAxis.min,
                            type: yAxis.type,
                            rotation: yAxis.rotation,
                            title: {
                                text: yAxis.titleText
                            },
                            scrollbar: {
                                enabled: true
                            },
                            labels: yAxis.labels? yAxis.labels: yAxis,
                            categories: yAxis.categories,
                            tickInterval: yAxis.tickInterval,
                            opposite: yAxis.opposite,
                            tickPosition: yAxis.tickPosition,
                        },
                        tooltip: tooltip,
                        plotOptions: {
                            columnrange: {
                                dataLabels: {
                                    formatter: function () {
                                    }
                                }
                            },
                            series: {
                                cursor: 'pointer',
                                point: {
                                    events: {
                                        click: handleChartClick,
                                    },
                                },
                                dataLabels: {
                                },
                                lineWidth: chart.lineWidth,
                            },
                            column: {
                                dataLabels: {
                                    enabled: true,
                                }
                            }
                        },
                        legend: chart.legend  ||  {
                            enabled: true
                        },
                        series: series,
                    }));
                    isShowBar('none');
            }
        } catch (error) {
            console.log(error);
        }
    }, [series]);

    Highcharts.addEvent(charts, 'click', e => {
        e.preventDefault();
    });

    function isShowBar(isEnabled) {
        var scrollbars = document.querySelectorAll(`.content-wrapper #${chart.id} .highcharts-scrollbar`);
        scrollbars.forEach(s=> s.style.display= isEnabled);
    }

    return (
        <div className= {c(t.mb3)} >
            <div id= {chart.id} style= {{margin: '0 auto', width: chart.width, height: 480}}></div>
        </div>
    )
}

HighChart.Highcharts = Highcharts;
export default HighChart;