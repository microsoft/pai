import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import React from "react";

import {
  ExecutorList,
  ExecutorViewDrawer,
} from "../../../models/executors/executors";
import CommonDebugTable from "../../../components/common/table/CommonDebugTable";
import TableProperty from "../../../components/common/table/TableProperty";
import Convert from "../../../models/utils/convert-utils";
import AppData from "../../../components/common/appdata-context";
import { SpinnerLoading } from "../../../../components/loading";
import {Link} from 'office-ui-fabric-react';
import DumpList from '../../../components/common/dump/dump-list';

export default class BatchExecutors extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      callbackChangeTab: props.callbackChangeTab,
      setSelectedExecutorId: props.setSelectedExecutorId,
      appInfo: props.appInfo,
      tableProperty: null,
      loaded: false,
      jobs: props.batchTimeJobs,
    };
    this.reload = this.reload.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    void this.reload();
  }

  reload() {
    const { appData } = this.context;
    try {
      const { jobs } = this.state;
      const jobsId = jobs.length > 0 && jobs.map((job) => job.jobId);
      const data = jobsId && new ExecutorList(appData, jobsId);
      if (data && data.executors.length > 0) {
        this.renderTable(data);
      }
    } catch (error) {
      console.log(error);
    }

    this.setState(
      {
        loaded: true,
      }
    );
  }

  renderTable(data) {
    const {appId, jobStatus, attemptId} = this.state.appInfo;
    const params = new URLSearchParams(window.location.search);
    const subCluster = params.get('subCluster');

    let columnHeaderArray = [
      { key: "ExecutorID", minWidth: 80, maxWidth: 80, disabled: false },
      { key: "Host", minWidth: 160, maxWidth: 160 },
      { key: "Status", minWidth: 50, maxWidth: 50 },
      { key: "RDD Blocks", minWidth: 85, maxWidth: 85 },
      { key: "Storage Memory", minWidth: 120, maxWidth: 120 },
      { key: "Disk Used", minWidth: 80, maxWidth: 80 },
      { key: "Cores", minWidth: 60, maxWidth: 60 },
      { key: "Active Tasks", minWidth: 80, maxWidth: 80 },
      { key: "Failed Tasks", minWidth: 80, maxWidth: 80 },
      { key: "Completed Tasks", minWidth: 110, maxWidth: 110 },
      { key: "Total Tasks", minWidth: 75, maxWidth: 75 },
      { key: "Task Time(GC Time)", minWidth: 50, maxWidth: 75 },
      { key: "Input", minWidth: 60, maxWidth: 65 },
      { key: "Shuffle Read", minWidth: 50, maxWidth: 75 },
      { key: "Shuffle Write", minWidth: 50, maxWidth: 75 },
      { key: 'Dump', minWidth: 240, maxWidth: 240 },
      { key: "Logs", minWidth: 50, maxWidth: 75 },
    ];

    //step2. set table data items content
    const columnDataItemArray = data.executors.map((executor, index) => {
      return {
        ExecutorID: executor.id,
        TaskExecutorIdExist: true,
        Host: executor._hostPort,
        Status: executor.status,
        "RDD Blocks": executor.rddBlocks,
        "Storage Memory": executor._memoryUsed,
        maxMemory: executor._maxMemory,
        "Disk Used": executor._diskUsed,
        Cores: executor.cores,
        "Active Tasks": executor.activeTasks,
        "Failed Tasks": executor.failedTasks,
        "Completed Tasks": executor.completedTasks,
        "Total Tasks": executor.totalTasks,
        "Task Time(GC Time)": executor._totalDuration,
        "GC Time": executor._totalGCTime,
        Input: executor._totalInputBytes,
        "Shuffle Read": executor._totalShuffleRead,
        "Shuffle Write": executor._totalShuffleWrite,
        "Dump": <DumpList
                  key={index}
                  executorStatus={executor.status}
                  jobStatus={jobStatus}
                  appId={appId}
                  jobType='SPARK'
                  attemptId={attemptId}
                  executorId={executor.id}
                  logsLinkHref={`/logView.html?appId=${appId}&jobType=SPARK&executorId=${executor.id}&jobStatus=${jobStatus}&subCluster=${subCluster}&attemptId=${attemptId}`}
                ></DumpList>,
        "Logs": <Link
                  href={`/logView.html?appId=${appId}&jobType=SPARK&executorId=${executor.id}&jobStatus=${jobStatus}&subCluster=${subCluster}&attemptId=${attemptId}`}
                  onClick={(event) => {
                    event.preventDefault();
                    window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
                  }}
                >
                    &nbsp;Logs
                </Link>,
      };
    });
    this.setState({
      tableProperty: new TableProperty(
        columnHeaderArray,
        columnDataItemArray,
        ["ExecutorID", "Status"],
        "ExecutorID"
      ),
    });
  }

  render() {
    const { tableProperty, loaded } = this.state;
    return (
      <div style={{ margin: "0 auto" }} className={c(t.mt4)}>
        {!loaded ? (
          <SpinnerLoading />
        ) : !tableProperty ? (
          <div className={c(t.pv2)}>
            No executor data of the batchTime
          </div>
        ) : (
          <div id="streaming-executors-table">
            {
              <CommonDebugTable
                handleClickExeId={this.handleClickExeId}
                tableProperty={tableProperty}
              />
            }
          </div>
        )}
      </div>
    );
  }
}

BatchExecutors.contextType = AppData;
