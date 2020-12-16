import React, { Component } from "react";
import { ActionButton } from "office-ui-fabric-react/lib/Button";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

export default class Toggle extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { handleClickisShowTable, title, isShow } = this.props.toggleProperty;

    return (
      <div className={c(t.flex, t.pointer)}>
        <ActionButton
          iconProps={{ iconName: isShow ? "FlickUp" : "FlickLeft" }}
          onClick={() => handleClickisShowTable(!isShow)}
        >
          <span>{title}</span>
        </ActionButton>
      </div>
    );
  }
}
