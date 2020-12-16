import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import AppData from "../../../components/common/appdata-context";
import { SpinnerLoading } from "../../../../components/loading";

export default class MetaData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      infos: null,
      loaded: false,
    };
    this.reload = this.reload.bind(this);
  }

  componentDidMount() {
    void this.reload();
  }

  async reload() {
    try {
      const { appData } = this.context;
      const metaDataInfos = await appData.getBatchInputMetadata(
        this.props.batchTimeId
      );
      this.setState(
        {
          infos: metaDataInfos,
        }
      );
    } catch (e) {
      console.log(e);
    }
    this.setState(
      {
        loaded: true,
      }
    );
  }

  render() {
    const { infos, loaded } = this.state;

    return (
      <div className={c("streaming-batchLeve-meta", t.mt4)}>
        {!loaded ? (
          <SpinnerLoading />
        ) : !infos || infos.length <= 0 ? (
          <div>No meta found.</div>
        ) : (
          infos.map((info, index) => (
            <div className={c(t.pa1, t.pre, t.overflowAuto)} key={index}>
              {info[1]}
            </div>
          ))
        )}
      </div>
    );
  }
}

MetaData.contextType = AppData;
