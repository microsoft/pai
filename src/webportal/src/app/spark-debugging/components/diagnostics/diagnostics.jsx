import React from 'react';
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
//import { ComboBox } from 'office-ui-fabric-react/lib/index';
//import { DefaultButton } from 'office-ui-fabric-react';

import AppData from '../common/appdata-context';
//import Diagnose from '../../models/diagnostics/diagnostics';
import DiagOne from './diagnose-one';

export default class Diagnostics extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            callbackChangeTab: props.callbackChangeTab,
            skewThreshold: props.skewThreshold,
            updateSkewThreshold: props.updateSkewThreshold,
            appInfo: props.appInfo,
            minDataList: [0, 128, 256, 512, 1024, 2048].map((number) => ({
                key: number,
                text: String(number)
            })),
            minTimeLimitList: [0, 1, 5, 10, 20, 60, 120].map((number) => ({
                key: number,
                text: String(number)
            })),
            timesList: [1, 2, 3, 5, 10].map((number) => ({
                key: number,
                text: String(number),
            })),
        };

        this.onChangeSizeLimit = this.onChangeSizeLimit.bind(this);
        this.onChangeTimeLimit = this.onChangeTimeLimit.bind(this);
        this.onChangeDataTimes = this.onChangeDataTimes.bind(this);
        this.onChangeTimeTimes = this.onChangeTimeTimes.bind(this);
        this.onChangeDelayLimit = this.onChangeDelayLimit.bind(this);

        this.onSaveThreshold = this.onSaveThreshold.bind(this);

        this.handleClickExeId = this.handleClickExeId.bind(this);
        this.handleClickStageId = this.handleClickStageId.bind(this);
    }

    handleClickExeId(exeId) {
        this.state.callbackChangeTab(
            'exedetail',
            null,
            null,
            exeId);
    }

    handleClickStageId(stageId) {
        this.state.callbackChangeTab(
            'stages',
            null,
            stageId,
            null);
    }

    onSaveThreshold(event) {
        this.state.updateSkewThreshold(this.state.skewThreshold);
    }

    onChangeSizeLimit(e, size) {
        let previousThreshold = this.state.skewThreshold;
        if (size.key === previousThreshold.dataSizeInM) {
            return;
        }
        this.setState({
            skewThreshold: {
                dataSizeInM: size.key,
                dataTimes: previousThreshold.dataTimes,
                timeInM: previousThreshold.timeInM,
                timeTimes: previousThreshold.timeTimes,
                delayInM: previousThreshold.delayInM
            }
        });

    }

    onChangeDataTimes(e, dataTime) {
        let previousThreshold = this.state.skewThreshold;
        if (dataTime.key === previousThreshold.dataTimes) {
            return;
        }
        this.setState({
            skewThreshold: {
                dataSizeInM: previousThreshold.dataSizeInM,
                dataTimes: dataTime.key,
                timeInM: previousThreshold.timeInM,
                timeTimes: previousThreshold.timeTimes,
                delayInM: previousThreshold.delayInM
            }
        });

    }

    onChangeTimeLimit(e, timeInM) {
        let previousThreshold = this.state.skewThreshold;
        if (timeInM.key === previousThreshold.timeInM) {
            return;
        }
        this.setState({
            skewThreshold: {
                dataSizeInM: previousThreshold.dataSizeInM,
                dataTimes: previousThreshold.dataTimes,
                timeInM: timeInM.key,
                timeTimes: previousThreshold.timeTimes,
                delayInM: previousThreshold.delayInM
            }
        });

    }


    onChangeTimeTimes(e, timeTime) {
        let previousThreshold = this.state.skewThreshold;
        if (timeTime.key === previousThreshold.timeTimes) {
            return;
        }
        this.setState({
            skewThreshold: {
                dataSizeInM: previousThreshold.dataSizeInM,
                dataTimes: previousThreshold.dataTimes,
                timeInM: previousThreshold.timeInM,
                timeTimes: timeTime.key,
                delayInM: previousThreshold.delayInM
            }
        });
    }

    onChangeDelayLimit(e, delayInM) {
        let previousThreshold = this.state.skewThreshold;
        if (delayInM.key === previousThreshold.delayInM) {
            return;
        }
        this.setState({
            skewThreshold: {
                dataSizeInM: previousThreshold.dataSizeInM,
                dataTimes: previousThreshold.dataTimes,
                timeInM: previousThreshold.timeInM,
                timeTimes: previousThreshold.timeTimes,
                delayInM: delayInM.key
            }
        });
    }

    render() {
        const { appData } = this.context;
        return (
            <div className={c('diagnostics', t.mt4)}>
                {
                    !appData ? <div>Get error when fetch stage data Spark history server</div>
                        : <div>{
                            appData.diagnotor.diagnoseResults.map((diag, index) =>
                                <DiagOne key={diag.name} diag={diag}
                                    handleClickExeId={this.handleClickExeId}
                                    appInfo={this.state.appInfo}
                                    handleClickStageId={this.handleClickStageId} />)
                        }</div>
                }
            </div>
        )
    }
}
Diagnostics.contextType = AppData;