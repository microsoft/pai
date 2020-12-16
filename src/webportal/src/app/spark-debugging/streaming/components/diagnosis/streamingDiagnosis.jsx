import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { SpinnerLoading } from "../../../../components/loading";
import AppData from "../../../components/common/appdata-context";
import { dialog } from "../../common/tools";
import DiagOne from "./diagnose-one";
export default class Diagnosis extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      diagnosisInfo: null,
      loaded: false,
      callbackChangeTab: props.callbackChangeTab,
    };
    this.onChangeDe = this.onChangeDe.bind(this);
    this.handleClickBatchTimeId = this.handleClickBatchTimeId.bind(this);
    this.reload = this.reload.bind(this);
  }
  async handleClickBatchTimeId(batchTimeId, e) {
    
    const {callbackChangeTab } = this.state;
    let jobs = [];
    try {
      const { appData } = this.context;
      jobs = await appData.getJobsByBatchId(batchTimeId);
    } catch (error) {
      console.log(error);
    }
   
    if (jobs.length > 0) {
      callbackChangeTab("batchleveldebug", batchTimeId, -1, 0, -1);
    } else {
      dialog(".streaming-diagnosis​", "#dialog", e, "table");
    }
  }


  async onChangeDe(type, newValue) {
    if (!type || !newValue || this.prevValue == newValue) return;
    const { appData } = this.context;
    let value = typeof newValue == "string" ? [Number(newValue)] : newValue;
    // pdateOneDignoseResult
    const diagnosisInfo = await appData.updateStreamingDiagnotorCondition(
      type,
      value
    );

    this.setState(
      {
        diagnosisInfo: diagnosisInfo,
      },
      () => {}
    );
    this.prevValue = newValue;
  }

  componentDidMount() {
    this.reload();
  }

  reload() {
    try {
      const { appData } = this.context;
      this.setState({
        loaded: true,
      });
      const diagnosisInfo = appData.getStreamingDiagnotorResults();
      this.setState({
        diagnosisInfo: diagnosisInfo,
      });
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    const { diagnosisInfo, loaded } = this.state;
    return (
      <div className={c("streaming-diagnosis​", t.mt4)}>
        {!loaded ? (
          <SpinnerLoading />
        ) : !diagnosisInfo ? (
          <div>
            Get error when fetch stage data Spark history server
          </div>
        ) : (
          <div>
            {diagnosisInfo.map((diag, index) => (
              <DiagOne
                key={diag.name}
                diag={diag}
                index={index}
                handleClickBatchTimeId={this.handleClickBatchTimeId}
                onChangeDe={this.onChangeDe}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}
Diagnosis.contextType = AppData;
