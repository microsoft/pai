import React from "react";
import { debounce, isEmpty, isNil } from "lodash";
import { Stack } from "office-ui-fabric-react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import Menu from "./menu/";
import Content from "./content/";

export default function Cluster() {
  const outerStackTokens = { childrenGap: 2 };
  const stackItemStyles = {
    root: {
      alignItems: 'center',
      display: 'flex',
      // justifyContent: 'center',
      overflow: 'hidden',
      width: "30%"
    },
  };
  return (
    <Stack
      className={c("virtual-cluster",t.pt2, t.pb3, t.pr2, t.overflowHidden)}
      horizontal
      verticalFill
      tokens={outerStackTokens}
    >
      <Stack.Item grow styles={stackItemStyles}>
        <Menu />
      </Stack.Item>
      <Stack.Item
        grow 
        styles={{ root: { overflowX: "auto", width: "70%" } }}
      >
        <Content />
      </Stack.Item>
    </Stack>
  );
}
