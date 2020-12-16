import ReactDom from "react-dom";
import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { toNumber, isNaN } from "lodash";
import { TextField } from "office-ui-fabric-react/lib/index";
import { FontClassNames } from "office-ui-fabric-react";

import AppData from "../../../components/common/appdata-context";
import CommonDebugTable from "../../../components/common/table/CommonDebugTable";
import TableProperty from "../../../components/common/table/TableProperty";
import DatepickerProperty from "../../../components/common/datepicker/datepicker";
import TimepickerMultiple from "../../../components/common/datepicker/datepickers";

export default class DiagOne extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      delayValue: null,
      recorValue: null,
      times: null,
      handleClickBatchTimeId: props.handleClickBatchTimeId,
      onChangeDe: props.onChangeDe,
      datepickerProperty: null,
      isErrorMessage: false,
      columnHeaderArray: [
        { key: "BatchTime", minWidth: 175, maxWidth: 175 },
        { key: "Records", minWidth: 150, maxWidth: 150 },
        { key: "SchedulingDelay", minWidth: 175, maxWidth: 175 },
        { key: "ProcessingTime", minWidth: 160, maxWidth: 160 },
        { key: "TotalDelay", minWidth: 150, maxWidth: 150 },
        { key: "Succeed/Total", minWidth: 150, maxWidth: 150 },
      ],

      infos: null,
      loaded: false,
      textFieldeLabel: [
        {
          before: "Batches with total delay",
          after: "times longer than average​",
        },
        { before: "Batches with records", after: "times more than average​" },
      ],
    };

    this.reload = this.reload.bind(this);
    this.datepickerOnchange = this.datepickerOnchange.bind(this);
    this.isSendValue = this.isSendValue.bind(this);
    this.setInfos = this.setInfos.bind(this);
  }

  datepickerOnchange(curDate, cur) {
    const startTime = Number(Date.parse(curDate.startTime));
    const endTime = Number(Date.parse(curDate.endTime));
    this.state.onChangeDe("TimeRange Selected", [
      startTime,
      endTime || this.state.endTime,
    ]);
  }

  componentDidMount() {
    void this.reload();
  }

  setInfos(diag) {
    if (!diag || diag.diagItemList.length <= 0) return [];
    return diag.diagItemList.map((x) => ({
      BatchTime: x.batchTime,
      Records: x.records,
      defaultValue: "",
      SchedulingDelay: x.schedulingDelay,
      ProcessingTime: x.processingTime,
      TotalDelay: x.totalDelay,
      "Succeed/Total": x.success + "/" + x.total,
    }));
  }

  reload() {
    const { diag } = this.props;
    try {
      if (diag.thresholdItemList.length > 1) {
        const times = diag.thresholdItemList.map((threshold) => {
          return Number(threshold.getValue());
        });
        this.setState({
          datepickerProperty: new DatepickerProperty(
            this.datepickerOnchange,
            times[0],
            times[1]
          ),
          loaded: true,
        });
      }
    } catch (e) {
      console.log(e);
      return {};
    }
  }

  isSendValue(event, newValue) {
    let type;
    if (newValue.length <= 7) {
      if (event.nativeEvent.inputType != "deleteContentForward") {
        if (isNaN(toNumber(newValue)) || !newValue) {
          this.setState({ defaultValue: newValue });
          if (!newValue) {
            this.setState({ isErrorMessage: false });
          } else {
            this.setState({ isErrorMessage: true });
          }
          if (!newValue) return;
          const curType = event.target.getAttribute("name");
          if (curType == "DelaySkew") {
            type = "Delay Skew";
            this.setState({ delayValue: newValue });
          } else if (curType == "RecordSkew") {
            type = "Records Skew";
            this.setState({ recorValue: newValue });
          }
          return false;
        } else {
          if (!newValue) return;
          const curType = event.target.getAttribute("name");
          if (curType == "DelaySkew") {
            type = "Delay Skew";
            this.setState({ delayValue: newValue });
          } else if (curType == "RecordSkew") {
            type = "Records Skew";
            this.setState({ recorValue: newValue });
          }
          this.setState({ defaultValue: newValue });
          return { t: type, v: newValue };
        }
      }
    } else {
      if (!newValue) return;
      if (event.nativeEvent.inputType != "deleteContentForward") {
        const curType = event.target.getAttribute("name");
        if (curType == "DelaySkew") {
          type = "Delay Skew";
          this.setState({ defaultValue: this.state.delayValue });
        } else if (curType == "RecordSkew") {
          type = "Records Skew";
          this.setState({ defaultValue: this.state.recorValue });
        }
        return false;
      }
    }
  }

  TextFieldonChange(event, newValue) {
    const sendO = this.isSendValue(event, newValue);
    sendO && this.state.onChangeDe(sendO.t, sendO.v);
  }

  render() {
    const {
      columnHeaderArray,
      datepickerProperty,
      textFieldeLabel,
      handleClickBatchTimeId,
      defaultValue,
    } = this.state;
    const { index, diag } = this.props;

    return (
      <div key={index} className={c(diag.name, t.ba, t.mb3, t.mr1, t.relative)}>
        <div className={c(t.flex, t.itemsCenter, t.justifyBetween)}>
          <div className={c(t.pa3, t.fw6, FontClassNames.mediumPlus)}>
            {diag.name === "Delay Skew" ? "Total Delay Skew" : diag.name}
          </div>
          <div className={c(t.flex, t.itemsCenter)}>
            {diag.thresholdItemList.map((threshold, i) => {
              if (diag.name != "TimeRange Selected") {
                return (
                  <div key={i} className={c(t.flex, t.itemsCenter)}>
                    <span className={c(t.ml3, t.mr3)}>
                      {textFieldeLabel[i].before}
                    </span>
                    <TextField
                      key={i}
                      name={threshold.type}
                      value={defaultValue}
                      defaultValue={threshold.getValue()}
                      onChange={this.TextFieldonChange.bind(this)}
                      styles={{ fieldGroup: { width: 100 } }}
                    />
                    <span className={c(t.ml3, t.mr3)}>
                      {textFieldeLabel[i].after}​
                    </span>
                  </div>
                );
              } else if (datepickerProperty && i < 1) {
                return (
                  <div key={i} className={c(t.flex)} name={threshold.type}>
                    <TimepickerMultiple
                      datepickerProperty={datepickerProperty}
                    />
                    <div className={c(t.mr3)}></div>
                  </div>
                );
              }
            })}
          </div>
        </div>
        <div>
          <CommonDebugTable
            handleClickBatchTimeId={handleClickBatchTimeId}
            tableProperty={
              new TableProperty(
                columnHeaderArray,
                this.setInfos(diag),
                "BatchTime",
                "BatchTime",
                5,
                "",
                true
              )
            }
          />
        </div>
      </div>
    );
  }
}

DiagOne.contextType = AppData;
