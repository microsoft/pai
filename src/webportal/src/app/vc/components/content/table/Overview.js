import React, { useEffect, useState, useCallback } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import uuid from 'uuid';
import {
  DefaultPalette,
  Stack,
  IStackStyles,
  IStackTokens,
  IStackItemStyles,
  FontClassNames,
} from "office-ui-fabric-react";
import Table from "../../common/tible/Table";
import EChart from "../../common/echarts/";
import { group } from "../../common/util";


function Overview({ vcData, totalResourcesAllocated, totalResourcesConfigured }) {
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isRenderTable, setIsRenderTable] = useState();

  const renderItemColumn = useCallback((item, index, column) => {
    const fieldContent = item[column.fieldName];
    let titleText = null;
    if (item.Name === "Submit Applications ACL") {
      titleText =
        "The ACL which controls who can submit applications to this queue, and is of the form user1,user2 space group1,group2.";
    } else if (item.Name === "Administer Applications ACL") {
      titleText =
        "The ACL which controls who can administer applications on this queue, and is of the form user1,user2 space group1,group2.";
    } else {
      titleText = fieldContent;
    }

    switch (column.key) {
      case "Name":
        return (
          <div title={titleText} className={c(t.black)}>
            {fieldContent}
          </div>
        );

      default:
        return <span title={fieldContent}>{fieldContent}</span>;
    }
  });

  const setChart = useCallback(() => {
    const chart = {
      id: "vc-content-overview-chart",
      style: { width: 240, height: 180 },
      text: "Overview",
    };
    const seriesData = [
      {
        name: "Available",
        value: totalResourcesConfigured,
      },
      { 
        name: "Utilized",
        value: totalResourcesAllocated
      },
    ];
    setChartData({ chart, seriesData });
  });

  const setTable = useCallback(() => {
    const admin = JSON.parse(cookies.get("admin"));
    const data = vcData;
    setIsRenderTable(
      vcData.numRunningApplications === 0 ||
        (vcData.numRunningApplications &&
          vcData.numRunningApplications != undefined)
    );
    const columns = [{ name: "Name" }, { name: "Value" }].map(
      ({ name }, i) => ({
        key: name,
        fieldName: name,
        minWidth: name === "Name" ? 165 : 100,
        maxWidth: name === "Name" ? 165: 100,
        className: FontClassNames.medium,
        isResizable: true,
      })
    );

    const items = [
      { name: "Num Running Application", value: "numRunningApplications" },
      {
        name: "Num Pending Application",
        value: "numNonRunningApplications",
      },
      { name: "Max Application", value: "maxApplications" },
      { name: "Max Application Per User", value: "maxApplications" },
      { name: "Accessible Node Labels", value: "nodeLabels" },
      { name: "Preemption", value: "preemptionDisabled", condition: true },
      {
        name: "Intra-queue Preemption",
        value: "intraQueuePreemptionDisabled",
        condition: true,
      },
      {
        name: "Default Node Label Expression",
        value: "defaultNodeLabelExpression",
      },
      { name: "Default Application Priority", value: "defaultPriority" },
      {
        name: "Submit Applications ACL",
        value: "submitApplicationsAcl",
        condition2: true,
      },
      {
        name: "Administer Applications ACL",
        value: "administerQueueAcl",
        condition2: true,
      },
      {
        name: admin ? "Configured Minimum User Limit Percent" : "",
        value: admin ? "userLimit" : "",
        scale: admin && true,
      },
      { name: admin ? "Configured User Limit Factor" : "", value: admin ? "userLimitFactor" : "" },
      {
        name: "",
        value: "",
      },
      {
        name: "",
        value: "",
      },
    ].map(({ name, value, condition, condition2, scale }, i) => {
      let Value = null;
      if (condition) {
        Value = data[value] ? "disabled" : "enabled";
      } else if (condition2) {
        Value = data[value] ? data[value] : "Not supported yet";
      } else if (scale) {
        Value = data[value] + "%";
      } else {
        Value = data[value];
      }
      return {
        Name: name,
        Value,
      };
    });

    setTableData({
      itemsList: group(items, 5),
      columns,
      renderItemColumn,
    });
  });

  useEffect(() => {
    try {
      if (vcData) {
        setChart();
        setTable();
      }
    } catch (error) {
      console.error;
    }
  }, [vcData, totalResourcesAllocated, totalResourcesConfigured]);

  return (
    <Stack
      horizontal
      id="vc-content-table-overview"
      className={c(t.w100, t.mb3)}
    >
      <Stack.Item> {chartData && <EChart chartData={chartData} />}</Stack.Item>
      <Stack.Item
        horizontal
        grow={4}
        className={
          isRenderTable
            ? c(t.bgWhite, t.flex, "table")
            : c(t.flex, "table")
        }
      >
        {tableData &&
          isRenderTable &&
          tableData.itemsList.map((items, i) => (
            <Table key={uuid()} items={items} {...tableData} />
          ))}
      </Stack.Item>
    </Stack>
  );
}

export default Overview;
