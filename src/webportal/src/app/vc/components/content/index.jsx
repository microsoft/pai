import React, { useState, useContext } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import {
  DefaultPalette,
  Stack,
  IStackStyles,
  IStackTokens,
  IStackItemStyles,
} from "office-ui-fabric-react";
import QueueCombobox from "./queueCombobox/QueueCombobox";
import Hyperlink from "./hyperlink/Hyperlink";
import Table from "./table/Table";

function Content() {
  const [subData, setSubData] = useState();

  return (
    <Stack
      verticalFill
      className={c("vc-content", t.h100)}
      styles={{ root: { overflowY: "hidden" } }}
    >
      {/* content */}
      {/* sub virtual cluster bombobox */}
      <Stack.Item>
        <QueueCombobox subData={subData} />
      </Stack.Item>

      {/* table */}
      <Stack.Item
        className={c(t.overflowAuto, t.w100)}
        styles={{ root: { height: "90%" } }}
      >
        <Table setSubData={setSubData} />
      </Stack.Item>
      <Stack.Item>
        <Hyperlink />
      </Stack.Item>
    </Stack>
  );
}

export default Content;
