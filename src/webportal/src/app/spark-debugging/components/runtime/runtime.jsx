import React from 'react';
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import '../../css/runtime.css';

import Convert from '../../models/utils/convert-utils';
import RuntimeHelper from '../../models/runtime/Runtimes';
import AppData from '../common/appdata-context';
import HighChart from '../common/highcharts/Highcharts';
import HighChartsProperty from '../common/highcharts/Highchart';
import {FontClassNames} from 'office-ui-fabric-react';
import { SpinnerLoading } from '../../../components/loading';

export default class Runtime extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            selectIndex: 0,
            stageInfo: null,
            chartProperty: null,
            dropDownItem: ['Duration', 'GcTime', 'SchedulerDelay', 'InputSize', 'InputRecord', 'OutputSize', 'OutputRecord',
                'ShuffleReadSize', 'ShuffleReadRecord', 'ShuffleWriteSize', 'ShuffleWriteRecord'],
            callbackChangeTab: props.callbackChangeTab,
        };

        this.reload = this.reload.bind(this);
        this.itemClick = this.itemClick.bind(this);
        this.updateGraph = this.updateGraph.bind(this);
        this.renderOption = this.renderOption.bind(this);
        this.handleData = this.handleData.bind(this);
        this.handleChartClick = this.handleChartClick.bind(this);

    }

    componentDidMount() {
        void this.reload();
    }

    itemClick(e) {
        this.setState({
            selectIndex: parseInt(e.target.value)
        }, () => {
            this.updateGraph();
        });
    }

    updateGraph() {
        const { stageInfo } = this.state;
        try {
            switch (this.state.selectIndex) {
                case 1: this.handleData(stageInfo, 'gcTime', 'Time');
                    break;
                case 2: this.handleData(stageInfo, 'schedulerDelay', 'Time');
                    break;
                case 3: this.handleData(stageInfo, 'inputSize', 'Data');
                    break;
                case 4: this.handleData(stageInfo, 'inputRecord', 'Records');
                    break;
                case 5: this.handleData(stageInfo, 'outputSize', 'Data');
                    break;
                case 6: this.handleData(stageInfo, 'outputRecord', 'Records');
                    break;
                case 7: this.handleData(stageInfo, 'shuffleReadSize', 'Data');
                    break;
                case 8: this.handleData(stageInfo, 'shuffleReadRecord', 'Records');
                    break;
                case 9: this.handleData(stageInfo, 'shuffleWriteSize', 'Data');
                    break;
                case 10: this.handleData(stageInfo, 'shuffleWriteRecord', 'Records');
                    break;
                default: this.handleData(stageInfo, 'duration', 'Time');
                    break;
            }
        } catch (error) {
            // To do: log the error info.
            console.log(error);
        }
    }

    handleChartClick(stage) {
        const stageId  = stage.point.x;
        this.state.callbackChangeTab('stages', -1, stageId, null);
    }

    handleData(data, dataTtpe, type) {
        if (!data || data.length <= 0) {
            return;
        }
        let categories = [];
        let series = [];
        let all = [
            { name: 'Min', save: [], data: [], color: 'rgba(238,40,40)' },
            { name: 'P50', save: [], data: [], color: 'rgba(0,128,0)' },
            { name: 'P95', save: [], data: [], color: 'rgba(255,165,0)' },
        ];
        let getConvertFun = Convert.nameConvert(type);
        let yMax = Math.max.apply(null, data.map((x) => x[dataTtpe].max));
        let yUnitName = getConvertFun.nameGetter(yMax);
        const convertYMax = getConvertFun.formatter(yMax, yUnitName);
        data.forEach((x) => {
            categories.push(x.name.split(" ")[0] + ' ' + x.name.split(" ")[1]);
            series = all.map((t) => {
                t.data.push(x[dataTtpe][t.name.toLowerCase()]);
                return {
                    name: t.name,
                    color: t.color,
                    data: t.data.map((m) => {
                        return getConvertFun.formatter(m, yUnitName);
                    })
                }
            })
        })

        const chart = {
            id: 'runtime-chart',
            chartType: 'column',
            chartTitle: { text: 'Summary Metrics for Tasks' },
            category: 'category',
        };
        const xAxis = {
            categories,
            crosshair: true
        };
        const yAxis = {
            max: Convert.handleMax(convertYMax),
            titleText: yUnitName ? type + ' / ' + yUnitName : type,
        };
        const tooltip = {
            formatter: function () {
                return '<b>' + this.x + ': ' + this.series.name + '</b><br/>'
                    + type + ': ' + this.y + yUnitName;
            }
        };

        this.setState({
            chartProperty: new HighChartsProperty(chart, xAxis, series, yAxis, tooltip)
        });
    }

    reload() {
        const { appData } = this.context;
        try {
            let stageInfo = RuntimeHelper.getStageInfoForRuntime(appData);
            this.setState({
                stageInfo: stageInfo
            }, () => { this.updateGraph() });
        } catch (error) {
            // To do: log the error info.
            console.log(error);
        }
        this.setState({
            loaded: true
        });
    }

    renderOption(index) {
        return (
            <option value={index.toString()} className={c(FontClassNames.medium)}>{this.state.dropDownItem[index]}</option>
        );
    }

    render() {
        const { chartProperty, loaded } = this.state;

        return (
            <div className='runtime'>
                <div className={c(t.mb3, t.mt4)}>
                    <select onChange={this.itemClick}>
                        {this.renderOption(0)}
                        {this.renderOption(1)}
                        {this.renderOption(2)}
                        {this.renderOption(3)}
                        {this.renderOption(4)}
                        {this.renderOption(5)}
                        {this.renderOption(6)}
                        {this.renderOption(7)}
                        {this.renderOption(8)}
                        {this.renderOption(9)}
                        {this.renderOption(10)}
                    </select>
                </div>
                {
                    !loaded ? <SpinnerLoading /> :
                        !chartProperty ?
                            <div className={c(t.mt4)}>No task data of the job.</div> :
                            <HighChart
                                chartProperty={chartProperty}
                                handleChartClick={this.handleChartClick}
                            />
                }
            </div>
        );
    }
}

Runtime.contextType = AppData;