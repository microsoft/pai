import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { Icon } from "office-ui-fabric-react/lib/index";

import ProgressBarLayout from "./ProgressBarLayout";

function ProgressBar(props) {
  const { label, iconName, styles } = props;
  const labelStyle = styles["label"] != undefined ? styles["label"] : {};

  return (
    <ProgressBarLayout {...props}>
      <div
        className={c(
          t.absolute,
          t.flex,
          t.itemsCenter,
          t.h100,
          t.w100,
          t.justifyBetween,
        )}
        style={{ ...labelStyle }}
      >
        <div>{label && label}</div>
        {iconName && (
          <div className={c(t.flex, t.itemsCenter, t.mr3, t.pr2)}>
            <Icon iconName={iconName} />
          </div>
        )}
      </div>
    </ProgressBarLayout>
  );
}

export default ProgressBar;
