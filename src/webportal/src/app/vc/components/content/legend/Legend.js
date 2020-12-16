import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import {
  usedOver,
  usedUnder,
  overCapacity,
  vcbg,
  menuClickBg,
} from "../../common/theme";

function Legend() {
  const Legend = [
    { name: "Used (under 80%)", bc: usedUnder },
    { name: "Used (over 80%)", bc: usedOver },
    { name: "Used (over capacity)", bc: overCapacity },
  ];

  return (
    <div className={c(t.flex, t.itemsCenter, t.pl2, t.f7, t.mb2, t.bgWhite)}>
      <div className={c(t.flex, t.itemsCenter)}>
        <span className={c(t.fw5, t.mr3)}>Legend:</span>
        {Legend.map((s, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#fff",
              border: `2px solid ${menuClickBg}`,
              height: 24,
              borderRadius: 10,
              width: 120,
              paddingLeft: 2,
              paddingRight: 2,
            }}
            className={c(t.flex, t.itemsCenter, t.pr2)}
          >
            <div
              style={{
                backgroundColor: s.bc,
                fontWeight: s.fontWeight,
                fontSize: s.fontSize,
                borderRadius: 10,
                height: 12,
                width: "100%"
              }}
              className={c(t.flex, t.justifyCenter)}
            >
              {s.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Legend;
