import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import SparkErrors from "../../models/errors/errors";
import { isEmpty } from "lodash";
import CommonDebugTable from "../common/table/CommonDebugTable";
import TableProperty from "../common/table/TableProperty";
import AppData from "../common/appdata-context";
import { SpinnerLoading } from "../../../components/loading";
import { ComboBox } from "office-ui-fabric-react/lib/index";
import {Link, Stack, StackItem} from 'office-ui-fabric-react';
export default class ErrorInfos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      appInfo: props.appInfo,
      callbackChangeTab: props.callbackChangeTab,
      options: ["Latest retry", "All"].map((text) => ({
        text,
        key: text,
      })),
      selectedKey: "Latest retry",
      relationMap: {
        "Latest retry": (args) => SparkErrors.getLatestAttemptErrorGroups(args),
        All: (args) => SparkErrors.getAllErrorGroups(args),
      },
      columnHeaderArray: [
        { key: "TaskID", minWidth: 75, maxWidth: 75 },
        { key: "StageID", minWidth: 60, maxWidth: 60 },
        { key: "ExecutorID", minWidth: 80, maxWidth: 80 },
        { key: "Host", minWidth: 160, maxWidth: 160 },
        {
          key: "ErrorMessage",
          minWidth: 200,
          maxWidth: 600,
          onRender(errorArray) {
            return (
              <span className={c(t.pointer)} title={errorArray.ErrorMessage}>
                {errorArray.ErrorMessage}
              </span>
            );
          },
        },
      ],

      infos: null,
      loaded: true,
    };
    this.reload = this.reload.bind(this);

    this.handleClickExeId = this.handleClickExeId.bind(this);
    this.handleClickStageId = this.handleClickStageId.bind(this);
    this.onChangeCombobox = this.onChangeCombobox.bind(this);
  }

  handleClickExeId(exeId) {
    this.state.callbackChangeTab("exedetail", null, null, exeId);
  }

  handleClickStageId(stageId) {
    this.state.callbackChangeTab("stages", null, stageId, null);
  }
  async onChangeCombobox(e, { key }) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.setState({ loaded: true });
    this.timer = setTimeout(() => {
      this.setState({ selectedKey: key });
    }, 1000);
  }

  componentDidMount() {
    void this.reload();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedKey !== this.state.selectedKey) {
      this.reload();
    }
  }

 reload() {
    try {
      const { appData } = this.context;
      const { relationMap, selectedKey } = this.state;
      const {appId, jobStatus, attemptId} = this.state.appInfo;
        const params = new URLSearchParams(window.location.search);
        const subCluster = params.get('subCluster');
      let errorGroups = relationMap[selectedKey](appData);
      if (!isEmpty(errorGroups)) {
        this.setState({ loaded: false });
      }
      let aggErrorInfos = new Array();
      for (let eIndex in errorGroups) {
        let errorArray = new Array();
        errorGroups[eIndex].map((x, index) => {
          errorArray.push({
            TaskID: x.taskId,
            StageID: x.stageId,
            ExecutorID: x.executorId,
            TaskExecutorIdExist: x.taskExecutorIdExist,
            'Host': (<Stack key={index} horizontal horizontalAlign='space-between'>
                <StackItem>{x.host}</StackItem>
                <StackItem>
                  <Link
                    href={`/logView.html?appId=${appId}&jobType=SPARK&executorId=${x.executorId}&jobStatus=${jobStatus}&subCluster=${subCluster}&attemptId=${attemptId}`}
                    onClick={(event) => {
                      event.preventDefault();
                      window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
                    }}
                  >Logs</Link>
                </StackItem>
              </Stack>),
            ErrorMessage: x.errorMessage,
          });
        });
        aggErrorInfos.push({ errorMsg: eIndex, errorArray: errorArray });
      }
      aggErrorInfos = aggErrorInfos.sort((x, y) => {
        if (x.errorMsg.length < y.errorMsg.length) {
          return -1;
        }
        if (x.errorMsg.length > y.errorMsg.length) {
          return 1;
        }
        return 0;
      });

      this.setState(
        {
          infos: aggErrorInfos,
          loaded: false,
        },
        () => {
          console.log("get error data");
        }
      );
    } catch (e) {
      this.setState({loaded: false});
      console.log(e);
    }
  }

  render() {
    const {
      columnHeaderArray,
      infos,
      loaded,
      options,
      selectedKey,
    } = this.state;
    return (
      <div className={c(t.mt2)}>
        {loaded ? (
          <SpinnerLoading />
        ) : !infos || infos.length <= 0 ? (
          <div>No error found.</div>
        ) : (
          <div className={c(t.flex, t.flexColumn)}>
            <div className={c(t.mb2, t.selfEnd)}>
              <ComboBox
                options={options}
                selectedKey={selectedKey}
                style={{ width: 150 }}
                onItemClick={this.onChangeCombobox}
              />
            </div>
            <div>
              {infos.map((info, index) => (
                <div className={c(t.mr1, t.bgWhite)} key={index}>
                  <div className={c(t.mb2, t.ml2)}>
                    <span>
                      <b>Error Message: </b>
                    </span>
                    {info.errorMsg ? info.errorMsg : ""}
                  </div>
                  <CommonDebugTable
                    handleClickExeId={this.handleClickExeId}
                    handleClickStageId={this.handleClickStageId}
                    tableProperty={
                      new TableProperty(
                        columnHeaderArray,
                        info.errorArray,
                        "TaskID",
                        "TaskID",
                        5
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}
ErrorInfos.contextType = AppData;
