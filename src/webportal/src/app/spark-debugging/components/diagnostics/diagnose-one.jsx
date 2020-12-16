import ReactDom from 'react-dom';
import React from 'react';
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import { ComboBox, addElementAtIndex } from 'office-ui-fabric-react/lib/index';
import {FontClassNames} from '@uifabric/styling';

import AppData from '../common/appdata-context';

//import Diagnose from '../../models/diagnostics/diagnostics';
import CommonDebugTable from '../common/table/CommonDebugTable';
import TableProperty from '../common/table/TableProperty';
import { SpinnerLoading } from '../../../components/loading';
import {Link, Stack, StackItem} from 'office-ui-fabric-react';

export default class DiagOne extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diag: props.diag,
            appInfo: props.appInfo,
            handleClickExeId: props.handleClickExeId,
            handleClickStageId: props.handleClickStageId,

            columnHeaderArray: [{ key: 'TaskID', minWidth: 75, maxWidth: 75 },
            { key: 'StageID', minWidth: 50, maxWidth: 50 },
            { key: 'ExecutorID', minWidth: 75, maxWidth: 75 },
            { key: 'Host', minWidth: 160, maxWidth: 160 },
            { key: 'Value', minWidth: 90, maxWidth: 90 },
            { key: 'Details', minWidth: 150, maxWidth: 150 }],

            infos: null,
            loaded: false
        };

        this.reload = this.reload.bind(this);
        this.onChangeSelected = this.onChangeSelected.bind(this);
    }

    componentDidUpdate(prevProps) {
        // Typical usage (don't forget to compare props):
        if (this.props.skewThreadhold !== prevProps.skewThreadhold) {
            this.setState({
                skewThreadhold: this.props.skewThreadhold
            }, () => {
                this.getInfo();
            })
        }
    }

    componentDidMount() {
        void this.reload();
    }

    reload() {
        const { appData } = this.context;
        const { diag } = this.state;
        const {appId, jobStatus, attemptId} = this.state.appInfo;
        const params = new URLSearchParams(window.location.search);
        const subCluster = params.get('subCluster');
        try {
            appData.updateDiagResults(diag.name);

            let items = new Array();
            diag.diagItemList.map((x, index) => {
                items.push(
                    {
                        'TaskID': x.task.taskId,
                        'StageID': x.task.stageId,
                        'ExecutorID': x.task.executorId,
                        'TaskExecutorIdExist': x.task.taskExecutorIdExist,
                        'Host': (<Stack key={index} horizontal horizontalAlign='space-between'>
                                    <StackItem>{x.task.host}</StackItem>
                                    <StackItem>
                                        <Link
                                            href={`/logView.html?appId=${appId}&jobType=SPARK&executorId=${x.task.executorId}&jobStatus=${jobStatus}&subCluster=${subCluster}&attemptId=${attemptId}`}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
                                            }}
                                        >Logs</Link>
                                    </StackItem>
                                </Stack>),
                        'Value': x.value,
                        'Details': x.details
                    }
                )
            });

            this.setState({
                infos: items,
                loaded: true,
            });
        } catch (e) {
            console.log(e);
        }
    }

    onChangeSelected(e, value) {
        const { diag } = this.state;
        if (diag.updateThreshold(value)) {
            this.reload();
        }
    }

    render() {
        const { columnHeaderArray, diag, infos, loaded } = this.state;
        return (
            <div key={diag.name} className={c(t.ba, t.mb3, t.mr1)}>
                <div className={c(t.pa3, t.fw6, FontClassNames.mediumPlus)}>{diag.name}</div>
                <div className={c(t.pl3, t.pb3, t.flex, t.itemsCenter)}>
                    <span className={c(t.mr3)}>{diag.desc} </span>
                    <div className={c(t.flex, t.itemsCenter, t.mr3, t.ml3)}>
                        {
                            diag.thresholdItemList.map((threshold, index) =>
                                <ComboBox key={index}
                                    options={threshold.selectedList}
                                    selectedKey={threshold.value}
                                    style={{ width: 150 }}
                                    onItemClick={this.onChangeSelected}
                                />
                            )}
                    </div>
                </div>
                <div>
                    {
                        !loaded ? <SpinnerLoading /> :
                            infos && infos.length > 0 ?
                                <CommonDebugTable
                                    handleClickExeId={this.state.handleClickExeId}
                                    handleClickStageId={this.state.handleClickStageId}
                                    tableProperty={new TableProperty(columnHeaderArray, infos, 'ExecutorID', 'Task Id', 5)}
                                />
                                : <span className={c(t.pa3)}>No skew task detected</span>
                    }
                </div>
            </div>
        )
    }
}

DiagOne.contextType = AppData;