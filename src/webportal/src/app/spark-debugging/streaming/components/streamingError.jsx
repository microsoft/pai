import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { Link } from "office-ui-fabric-react";

import CommonDebugTable from "../../components/common/table/CommonDebugTable";
import TableProperty from "../../components/common/table/TableProperty";
import AppData from "../../components/common/appdata-context";
import { SpinnerLoading } from "../../../components/loading";

export default class Error extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      callbackChangeTab: props.callbackChangeTab,
      columnHeaderArray: [
        { key: "StageID", minWidth: 75, maxWidth: 75, disabled: true },
        { key: "JobID", minWidth: 60, maxWidth: 60 },
        {
          key: "BatchTime",
          minWidth: 80,
          maxWidth: 80,
          onRender(item) {
            return (
              <Link onClick={() => props.callbackChangeTab("batchleveldebug")}>
                {item.BatchTime}
              </Link>
            );
          }
        },
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
          }
        }
      ],

      infos: null,
      loaded: false
    };
    this.reload = this.reload.bind(this);
  }

  componentDidMount() {
    void this.reload();
  }

  reload() {
    try {
      const { appData } = this.context;
      if (appData.getFailBatches) {
        const errorInfos = appData.getFailBatches();
        this.setState(
          {
            infos: errorInfos
          }
        );
      }
    } catch (e) {
      console.log(e);
    }
    this.setState(
      {
        loaded: true
      }
    );
  }

  render() {
    const { columnHeaderArray, infos, loaded } = this.state;

    return (
      <div className={c("streaming-error", t.mt4)}>
        {!loaded ? (
          <SpinnerLoading />
        ) : !infos || infos.length <= 0 ? (
          <div>No error found.</div>
        ) : (
          infos.map((info, index) => (
            <div className={c(t.mr1)} key={index}>
              <div className={c(t.ml3)}>
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
                    "JobID",
                    "JobID",
                    5
                  )
                }
              />
            </div>
          ))
        )}
      </div>
    );
  }
}
Error.contextType = AppData;
