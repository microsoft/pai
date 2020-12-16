import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import React from 'react';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

import { GraphDataDeal } from '../../models/exedetail/executor-detail';
//import { Application } from '../../models/jobgraph/jobgraph';
import Convert from '../../models/utils/convert-utils';
import AppData from '../common/appdata-context';
import HighChart from '../common/highcharts/Highcharts';
import HighChartsProperty from '../common/highcharts/Highchart';
import { ComboBox } from 'office-ui-fabric-react/lib/index';
import { SpinnerLoading } from '../../../components/loading';
import CommonDebugTable from '../common/table/CommonDebugTable';
import TableProperty from '../common/table/TableProperty';

export default class RuntExecutorDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedExecutorId: props.selectedExecutorId,
            prevTab: props.prevTab,
            callbackChangeTab: props.callbackChangeTab,
            dataSkChartProperty: null,
            TaskVcoreChartProperty: null,
            TaskRunChartProperty: null,
            executorList: null,
            rawData: null,
            selectedExectorInfo: null,
            loaded: false,
            tableProperty: null
        };

        this.reload = this.reload.bind(this);
        this.clearClick = this.clearClick.bind(this);
        this.renderTaskDataSkewChart = this.renderTaskDataSkewChart.bind(this);
        this.renderTaskVcoreChart = this.renderTaskVcoreChart.bind(this);
        this.renderTaskRunChart = this.renderTaskRunChart.bind(this);

        this.onChangeExecutorCombobox = this.onChangeExecutorCombobox.bind(this);
        this.filterExecutors = this.filterExecutors.bind(this);
        this.renderTable = this.renderTable.bind(this);
    }

    clearClick(e) {
        this.state.callbackChangeTab(
            this.state.prevTab,
            null,
            null,
            this.state.selectedExecutorId
        )
    }

    componentDidMount() {
        void this.reload();
    }

    onChangeExecutorCombobox(e, Executors) {
        this.setState({
            dataSkChartProperty: null,
            TaskVcoreChartProperty: null,
            TaskRunChartProperty: null,
            selectedExecutorId: Number(Executors.key)
        }, () => {
            this.filterExecutors(this.state.selectedExecutorId);
            this.state.callbackChangeTab(
                "exedetail",
                null,
                null,
                this.state.selectedExecutorId
            );
        });
    }

    filterExecutors(selectedExecutorId) {
        const { appData } = this.context;
        try {
            // not add job filter
            let executors = appData.getAllExecutorSimpleInfo();
            let index = executors.findIndex(x => Number(x.key) === Number(selectedExecutorId));
            if (index === -1) {
                throw "can not find selected executorId:" + selectedExecutorId;
            }
            let executor = executors[index];
            this.setState(
                {
                    selectedExecutorId: executor.key,
                    executorList: executors,
                    selectedExectorInfo: executor,
                    rawData: appData.executorList.find(exe => Number(exe.id) === Number(selectedExecutorId)),
                },
                () => {
                    const result = GraphDataDeal.getDataSkewGraphData(this.state.rawData);
                    if (!result || result.length < 1) return;
                    this.renderTaskDataSkewChart(result);
                    this.renderTaskVcoreChart(GraphDataDeal.getExecutorVcoreData(this.state.rawData, 50, appData.appEnvInfo.taskCores));
                    this.renderTaskRunChart(GraphDataDeal.getTaskRunData(this.state.rawData));
                    this.renderTable(this.state.rawData);
                })
        }
        catch (e) {
            alert(e);
            console.log(e);
        }
    }

    reload() {
        this.filterExecutors(this.state.selectedExecutorId);
        this.setState({
            loaded: true
        });
    }

    renderTaskDataSkewChart(data) {
        //Gets the maximum value and conversion unit for the axis
        const { xMax, yMax, xUnitName, yUnitName } = Convert.getChartArguments(data);
        const convertXmax = Convert.formatBytesByUnitName(xMax, xUnitName);
        const convertYmax = Convert.formatTimeByUnitName(yMax, yUnitName);
        const chart = {
            id: 'executor_data-skew',
            chartType: 'scatter',
            chartTitle: { text: 'Task Scatter in executor' }
        };
        const xAxis = {
            max: Convert.handleMax(convertXmax),
            titleText: 'Data Size / ' + xUnitName,
        };
        const yAxis = {
            max: Convert.handleMax(convertYmax),
            titleText: 'Exectution Time / ' + yUnitName,
        };
        const series = [{
            name: 'Task ID',
            data: data.map((d) => {
                return [
                    Convert.formatBytesByUnitName(d.x, xUnitName),
                    Convert.formatTimeByUnitName(d.y, yUnitName)
                ]
            })
        }];
        const tooltip = {
            formatter: function () {
                const alikeTask = data.filter(d => {
                    return (Convert.formatTimeByUnitName(d.y, yUnitName) === this.y && Convert.formatBytesByUnitName(d.x, xUnitName) === this.x);
                });
                return '<b>' + this.series.name + ': ' + alikeTask.map(e => e.text).join() + '</b><br/>'
                    + 'x: ' + this.x + xUnitName + ' ' + 'y: ' + this.y + yUnitName + '<br/>'
                    + 'stage ID: ' + alikeTask.map(e => e.stageId).join();
            }
        };
        this.setState({
            dataSkChartProperty: new HighChartsProperty(chart, xAxis, series, yAxis, tooltip)
        });
    }

    renderTaskVcoreChart(chartData) {
        const chart = {
            id: 'executor_vcore',
            chartType: 'line',
            chartTitle: { text: 'vCore' }
        };
        const xAxis = {
            tickInterval: 4,
            categories: chartData.map(d => {
                return Convert.date('Y/m/d/H:i:s', d.x);
            })
        };
        const yAxis = {
            titleText: 'Number of vCores',
        };
        const series = [{
            name: 'Executor vCore utilized',
            color: chartData[0].extend,
            data: chartData.map(d => d.y)
        }];
        const tooltip = {
            formatter: function () {
                return '<b>' + this.series.name + ': ' + this.y + '</b><br/>' + this.x;
            }
        };

        this.setState({
            TaskVcoreChartProperty: new HighChartsProperty(chart, xAxis, series, yAxis, tooltip)
        });
    }

    renderTaskRunChart(chartData) {
        const chart = {
            id: 'executor_task_run',
            chartType: 'columnrange',
            inverted: true,
            chartTitle: { text: 'Task Runtime' }
        };
        const yAxis = {
            labels: {
                formatter: function () {
                    return Convert.date('Y/m/d/H:i:s', this.value)
                },
                rotation: -45,
            },
        };
        const xAxis = {
            categories: chartData.map(t => t.y)
        };
        const series = [{
            "turboThreshold": chartData.length,
            name: 'Task ID',
            color: chartData[0].extend,
            data: chartData.map(t => t.x)
        }];
        const tooltip = {
            formatter: function () {
                const task = chartData.find((task)=> this.x === task.y);
                return '<b>' + this.series.name + ' : ' + task.text + '</b><br/>' +
                    'range : ' + Convert.date('H:i:s', this.point.low) + '-' + Convert.date('H:i:s', this.point.high) + '<br/>'
                    + 'stage ID: ' + task.stageId;
            }
        };
        this.setState({
            TaskRunChartProperty: new HighChartsProperty(chart, xAxis, series, yAxis, tooltip)
        });
    }

    renderTable(rawData) {
        const data = [rawData];
        let columnHeaderArray = [
            { key: 'ExecutorID', minWidth: 60, maxWidth: 60, disabled: true },
            { key: 'Address', minWidth: 120, maxWidth: 120, disabled: true },
            { key: 'Status', minWidth: 50, maxWidth: 50, disabled: true },
            { key: 'RDD Blocks', minWidth: 85, maxWidth: 85, disabled: true },
            { key: 'Storage Memory', minWidth: 110, maxWidth: 110, disabled: true },
            { key: 'Disk Used', minWidth: 70, maxWidth: 70, disabled: true },
            { key: 'Cores', minWidth: 60, maxWidth: 60, disabled: true },
            { key: 'Active Tasks', minWidth: 80, maxWidth: 80, disabled: true },
            { key: 'Failed Tasks', minWidth: 80, maxWidth: 80, disabled: true },
            { key: 'Completed Tasks', minWidth: 105, maxWidth: 105, disabled: true },
            { key: 'Total Tasks', minWidth: 75, maxWidth: 75, disabled: true },
            { key: 'Task Time(GC Time)', minWidth: 130, maxWidth: 130, disabled: true },
            { key: 'Input', minWidth: 65, maxWidth: 65, disabled: true },
            { key: 'Shuffle Read', minWidth: 85, maxWidth: 85, disabled: true },
            { key: 'Shuffle Write', minWidth: 85, maxWidth: 85, disabled: true }
        ];
        //step2. set table data items content
        const columnDataItemArray = data.map((executor) => {
            return ({
                'ExecutorID': executor.id,
                'TaskExecutorIdExist': true,
                'Address': executor.host,
                'Status': executor.isActive ? 'Active' : 'Dead',
                'RDD Blocks': executor.rddBlocks,
                'Storage Memory': executor.memoryUsed,
                maxMemory: executor.maxMemory,
                'Disk Used': executor.diskUsed,
                'Cores': executor.totalCores,
                'Active Tasks': executor.activeTasks,
                'Failed Tasks': executor.failedTasks,
                'Completed Tasks': executor.completedTasks,
                'Total Tasks': executor.totalTasks,
                'Task Time(GC Time)': executor.totalDuration,
                'GC Time': executor.totalGCTime,
                'Input': executor.totalInputBytes,
                'Shuffle Read': executor.totalShuffleRead,
                'Shuffle Write': executor.totalShuffleWrite
            });
        });
        this.setState(
            {
                tableProperty: new TableProperty(columnHeaderArray, columnDataItemArray, 'ExecutorDetailID', 'ExecutorDetailID')
            });
    }

    render() {
        const {
            selectedExecutorId,
            dataSkChartProperty,
            TaskVcoreChartProperty,
            TaskRunChartProperty,
            executorList,
            selectedExectorInfo,
            loaded,
            tableProperty
        } = this.state;
        const { appData } = this.context;
        return (
            <div className='executor-detail'>
                <div className={c(t.fr, t.pointer, t.mt3, t.mr3)} onClick={this.clearClick}><Icon iconName='Clear' /></div>
                <div className={c(t.flex, t.justifyCenter, t.mb3, t.itemsCenter)}>
                    <div></div>
                    <span className={c(t.mr3)}>Executors:</span>
                    {
                        !executorList ? '' : <ComboBox
                            options={executorList}
                            selectedKey={selectedExecutorId}
                            style={{ width: 150 }}
                            onItemClick={this.onChangeExecutorCombobox}
                        />}
                </div>
                {
                    !loaded ? <SpinnerLoading /> :
                        !dataSkChartProperty ?
                            <div>No Tasks Running On This Executor</div> :
                            <div>
                                <CommonDebugTable
                                    tableProperty={tableProperty}
                                />
                                <HighChart
                                    chartProperty={dataSkChartProperty}
                                />
                            </div>
                }
                {TaskVcoreChartProperty ?
                    <HighChart
                        chartProperty={TaskVcoreChartProperty}
                    /> :
                    <div></div>
                }
                {TaskRunChartProperty ?
                    <HighChart
                        chartProperty={TaskRunChartProperty}
                    /> :
                    <div></div>
                }
            </div>
        )
    }
}

RuntExecutorDetails.contextType = AppData;

