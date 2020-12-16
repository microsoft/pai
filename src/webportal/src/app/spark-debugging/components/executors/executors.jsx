import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import React from 'react';

import { ExecutorList, ExecutorViewDrawer } from '../../models/executors/executors';
import CommonDebugTable from '../common/table/CommonDebugTable';
import TableProperty from '../common/table/TableProperty';
import Convert from '../../models/utils/convert-utils'
import CommonChart from '../common/chart/CommonChart';
import ChartProperty from '../common/chart/ChartProperty';
import HighChart from '../common/highcharts/Highcharts';
import HighChartsProperty from '../common/highcharts/Highchart';
import AppData from '../common/appdata-context';
import { SpinnerLoading } from '../../../components/loading';
import {Link} from 'office-ui-fabric-react';
import DumpList from '../common/dump/dump-list';

export default class RuntExecutors extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            callbackChangeTab: props.callbackChangeTab,
            appInfo: props.appInfo,

            tableProperty: null,
            chartProperty: null,
            loaded: false,
        };
        this.setState = this.setState.bind(this);
        this.reload = this.reload.bind(this);
        this.renderTable = this.renderTable.bind(this);
        this.handleClickExeId = this.handleClickExeId.bind(this);
    }

    handleClickExeId(exeId) {
        this.state.callbackChangeTab(
            'exedetail',
            null,
            null,
            exeId);
    }

    componentDidMount() {
        void this.reload();
    }

    reload() {
        const { appData } = this.context;

        try {
            let data = new ExecutorList(appData);
            if (data && data.executors.length > 0) {
                this.renderChart(data);
                this.renderTable(data);
            }
        } catch (error) {
            console.log(error);
            alert(error);
        }

        this.setState({
            loaded: true
        });
    };

    renderChart(data) {
        let xMax = Math.ceil(1.1 * Convert.formatBytesByUnitName(data.maxExecutorDataSize, data.executorDataSizeUnitName));
        let yMax = Math.ceil(1.1 * Convert.formatTimeByUnitName(data.maxExecutionTime, data.executionTimeUnitName));
        const chart = {
            id: 'executor-chart',
            chartType: 'scatter',
            chartTitle: { text: 'Executor Scatter' }
        };
        const xAxis = {
            max: Convert.handleMax(xMax),
            titleText: 'TotalInputBytes / ' + data.executorDataSizeUnitName,
        };
        const yAxis = {
            max: Convert.handleMax(yMax),
            titleText: 'ExectutionTime / ' + data.executionTimeUnitName.toUpperCase(),
        };
        const series = [{
            name: 'Executor ID',
            data: data.executors.map((executor) => {
                return [
                    Convert.formatBytesByUnitName(executor.executorDataSize, data.executorDataSizeUnitName),
                    Convert.formatTimeByUnitName(executor.executionTime, data.executionTimeUnitName)
                ]
            })
        }];
        const tooltip = {
            formatter: function () {
                const alikeExecutors = data.executors.filter(d => {
                    return (Convert.formatTimeByUnitName(d.executionTime, data.executionTimeUnitName) === this.y && Convert.formatBytesByUnitName(d.executorDataSize, data.executorDataSizeUnitName) === this.x)
                });
                return '<b>' + this.series.name + ': ' + alikeExecutors.map(e => e.id).join() + '</b><br/>'
                    + 'x: ' + this.x + data.executorDataSizeUnitName + ' ' + 'y: ' + this.y + data.executionTimeUnitName;
            }
        };
        this.setState({
            chartProperty: new HighChartsProperty(chart, xAxis, series, yAxis, tooltip)
        });
    }

    renderTable(data) {
        const {appId, jobStatus, attemptId} = this.state.appInfo;
        const params = new URLSearchParams(window.location.search);
        const subCluster = params.get('subCluster');

        let columnHeaderArray = [{ key: 'ExecutorID', minWidth: 80, maxWidth: 80 },
        { key: 'Address', minWidth: 60, maxWidth: 60 },
        { key: 'Status', minWidth: 50, maxWidth: 50 },
        { key: 'RDD Blocks', minWidth: 85, maxWidth: 85 },
        { key: 'Storage Memory', minWidth: 120, maxWidth: 120 },
        { key: 'Disk Used', minWidth: 80, maxWidth: 80 },
        { key: 'Cores', minWidth: 60, maxWidth: 60 },
        { key: 'Active Tasks', minWidth: 80, maxWidth: 80 },
        { key: 'Failed Tasks', minWidth: 80, maxWidth: 80 },
        { key: 'Completed Tasks', minWidth: 110, maxWidth: 110 },
        { key: 'Total Tasks', minWidth: 75, maxWidth: 75 },
        { key: 'Task Time(GC Time)', minWidth: 50, maxWidth: 75 },
        { key: 'Input', minWidth: 60, maxWidth: 65 },
        { key: 'Shuffle Read', minWidth: 50, maxWidth: 75 },
        { key: 'Shuffle Write', minWidth: 50, maxWidth: 75 },
        { key: 'Dump', minWidth: 240, maxWidth: 240 },
        { key: 'Logs', minWidth: 30, maxWidth: 50 },
        { key: 'Error', minWidth: 50, maxWidth: 75 }];

        //step2. set table data items content
        const columnDataItemArray = data.executors.map((executor, index) => {
            return ({
                'ExecutorID': executor.id,
                'TaskExecutorIdExist': true,
                'Address': executor.address,
                'Status': executor.status,
                'RDD Blocks': executor.rddBlocks,
                'Storage Memory': executor._memoryUsed,
                'maxMemory': executor._maxMemory,
                'Disk Used': executor._diskUsed,
                'Cores': executor.cores,
                'Active Tasks': executor.activeTasks,
                'Failed Tasks': executor.failedTasks,
                'Completed Tasks': executor.completedTasks,
                'Total Tasks': executor.totalTasks,
                'Task Time(GC Time)': executor._totalDuration,
                'GC Time': executor._totalGCTime,
                'Input': executor._totalInputBytes,
                'Shuffle Read': executor._totalShuffleRead,
                'Shuffle Write': executor._totalShuffleWrite,
                'Dump': <DumpList
                            key={index}
                            executorStatus={executor.status}
                            jobStatus={jobStatus}
                            appId={appId}
                            jobType='SPARK'
                            executorId={executor.id}
                            attemptId={attemptId}
                            logsLinkHref={`/logView.html?appId=${appId}&jobType=SPARK&executorId=${executor.id}&jobStatus=${jobStatus}&subCluster=${subCluster}&attemptId=${attemptId}`}
                        ></DumpList>,
                'Logs': <Link
                            href={`/logView.html?appId=${appId}&jobType=SPARK&executorId=${executor.id}&jobStatus=${jobStatus}&subCluster=${subCluster}&attemptId=${attemptId}`}
                            onClick={(event) => {
                                event.preventDefault();
                                window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
                            }}
                        >Logs</Link>,
            });
        });
        this.setState(
            {
                tableProperty: new TableProperty(columnHeaderArray, columnDataItemArray, ['ExecutorID', 'Status'], 'ExecutorID')
            }
        );
    }

    render() {
        const { tableProperty, chartProperty, loaded } = this.state;

        return (
            <div style={{ margin: '0 auto' }}>
                {
                    !loaded ? <SpinnerLoading /> :
                        (!chartProperty || !tableProperty) ?
                            <div className={c(t.mt4)}>No executor data can be found on Spark history server</div> :
                            <div className={c(t.mt4)}><div id='executors-chart'>
                                {
                                    <HighChart
                                        chartProperty={chartProperty}
                                    />}
                            </div>
                                <div id='executors-table'>
                                    {<CommonDebugTable
                                        handleClickExeId={this.handleClickExeId}
                                        tableProperty={tableProperty}
                                    />}
                                </div></div>
                }
            </div>
        )
    }
}

RuntExecutors.contextType = AppData;