import React, { useEffect, useState, useCallback } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import {
  DefaultPalette,
  Stack,
  IStackStyles,
  IStackTokens,
  IStackItemStyles,
  FontClassNames,
  DetailsRow,
} from "office-ui-fabric-react";
import Table from "../../common/tible/Table";
import EChart from "../../common/echarts/";
import { chartColors } from "../../common/theme";
import {
  setTruncatedString,
  convertToToken,
  handleResourceInfo,
  filterUserResource,
  filterEmptyLabel,
  group,
  dispatch,
  filterResource,
} from "../../common/util";

function ActiveUsers({ user, vcData, ordering, setOrderingCb }) {
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [chartCase, setChartCase] = useState();
  const [totalResourcesConfigured, setTotalResourcesConfigured] = useState();

  useEffect(() => {
    const filterPartitionResources = filterEmptyLabel(
      vcData.capacityAndResourceInfo
    )
      .map((resourceInfo) => convertToToken(resourceInfo.resourcesConfigured))
      .reduce((prev, cur) => prev + cur, 0);

    setTotalResourcesConfigured(filterPartitionResources);
  }, [vcData]);

  useEffect(() => {
    try {
      const users = user && user["user"];
      setChart(users);
      setTable(users);
    } catch (error) {
      console.error;
    }
  }, [user]);

  useEffect(() => {
    if (totalResourcesConfigured) {
      const users = user && user["user"];
      setChart(users);
    }
  }, [totalResourcesConfigured, ordering]);

  useEffect(() => {
    if (chartCase) {
      setTable();
    }
  }, [chartCase, totalResourcesConfigured, ordering]);

  const getChartOption = useCallback((charts) => {
    setChartCase(charts);
  });

  const onMouse = (e, { item: { "User Name": name } }, type) => {
    e.stopPropagation();
    if (name) {
      dispatch(chartCase, type)(name);
    }
  };

  const onRenderRow = (props) => {
    if (props) {
      return (
        <DetailsRow
          {...props}
          onMouseOver={(e) => onMouse(e, props)}
          onMouseLeave={(e) => onMouse(e, props, true)}
        />
      );
    }
    return null;
  };

  const setChart = useCallback((userList = []) => {
    const { field } = ordering;
    const condition =
      field === "" ||
      field === "User Name" ||
      field === "Pending Apps" ||
      field === "Total" ||
      field === "Running Apps";
    const partitions = tableData && tableData["items"];
    const items = partitions && !condition ? partitions : userList.slice();
    const text = `Active users ${
      items.length ? (condition && "in " + "total") || "in " + field : ""
    }`;
    let useds = [];
    let seriesData = [];
    let tooltip = null;
    const scaleMap = [];
    let availableSapacityScale;
    const chart = {
      id: "vc-activeusers-chart",
      style: { width: 240, height: 180 },
      // legendShow: "notShow",
      text,
      color: items.length ? "#FFF" : chartColors[0],
      chartColors: items.length ? chartColors.slice(1) : chartColors,
    };

    if (items.length && totalResourcesConfigured) {
      let useToken = 0;
      items.forEach((item, i) => {
        const name = (!condition && item["User Name"]) || item["username"];
        const usageToken =
          item[field] && !condition
            ? item[field]
            : convertToToken(item.resourcesUsed, "max");
        useToken += usageToken;
        const usageScale = (
          (usageToken / totalResourcesConfigured) *
          100
        ).toFixed(2);
        useds.push(usageScale);
        scaleMap[usageScale] =
          usageToken + "/" + totalResourcesConfigured.toFixed();
        seriesData.push({
          name: setTruncatedString(name, 8),
          icon: "none",
          value: usageScale,
        });
      });

      const utilized = useds.reduce((prev, cur) => Number(prev) + Number(cur));
      availableSapacityScale =
        utilized >= 100 ? 0.0 : (100 - utilized).toFixed(2);
      scaleMap[availableSapacityScale === 0 ? "0.00" : availableSapacityScale] =
        (totalResourcesConfigured - useToken).toFixed() +
        "/" +
        totalResourcesConfigured.toFixed();

      tooltip = {
        trigger: "item",
        formatter: function ({ value, name }) {
          const token = scaleMap[value.toString()];
          if (!token) {
            return `${value}%`;
          }
          return `${name}<br />${token}<br />${value}%`;
        },
      };
    } else {
      chart["legendShow"] = "notShow";
      seriesData.push({
        name: "",
        icon: "none",
        value: "0.00",
      });
    }

    seriesData.push({
      name: setTruncatedString("Available", 8),
      icon: "none",
      value: availableSapacityScale,
      itemStyle: { color: chartColors[0] },
    });

    setChartData({ chart, seriesData, tooltip });
  });

  const setTable = useCallback(() => {
    const users = (user && user["user"]) || [];
    try {
      let items;
      if (totalResourcesConfigured) {
        let tableHederNames = [
          { name: "User Name", key: "username" },
          { name: "Total", key: "total" },
          { name: "Running Apps", key: "Running Apps" },
          { name: "Pending Apps", key: "Pending Apps" },
        ];
        const partitionResources = users.map((user) => {
          return filterUserResource(
            vcData.capacityAndResourceInfo,
            user.resources.resourceUsagesByPartition
          );
        });

        if (partitionResources.length > 0) {
          [
            ...new Set(
              partitionResources
                .reduce((p, c) => p.concat(c))
                .map((p) =>
                  p.partitionName == "" ? "default_partition" : p.partitionName
                )
            ),
          ].map((p, i) => {
            if (p) {
              tableHederNames.splice(i + 1, 0, { name: p, key: p });
            }
          });
        }

        let columns = tableHederNames.map(({ name }, i) => {
          const width = 830 / tableHederNames.length;
          return {
            key: name,
            name: name,
            fieldName: name,
            minWidth: width,
            maxWidth: width,
            className: FontClassNames.medium,
            headerClassName: FontClassNames.medium,
            isResizable: true,
          };
        });

        const userList = [
          "username",
          "resourcesUsed",
          "numActiveApplications",
          "numPendingApplications",
          "",
        ];
        if (users.length > 0) {
          items = users.map((user, i) => {
            let totalToken = 0;
            let totalResourecInfo = { memory: 0, vCores: 0 };
            let item = {
              "User Name": user[userList[0]],
              Total: 0,
              "Running Apps": user[userList[2]],
              "Pending Apps": user[userList[3]],
            };
            const partitions = partitionResources[i];
            if (partitions && partitions.length > 0) {
              partitions.forEach((p, i) => {
                const usedToken = convertToToken(p.used, "max");
                totalResourecInfo.memory += p.used.memory;
                totalResourecInfo.vCores += p.used.vCores;
                totalToken += usedToken;
                item[p.partitionName] = usedToken.toString();
                item[p.partitionName.toUpperCase()] = handleResourceInfo(
                  p.used
                );
                return usedToken;
              });
            }
            item["Total".toUpperCase()] = handleResourceInfo(totalResourecInfo);
            item.Total = Math.round(totalToken || 0);
            return item;
          });

          tableHederNames.forEach(({ name }) => {
            items = items.map((item, i) => {
              if (!item.hasOwnProperty(name)) {
                item[name] = "0";
                item[name.toUpperCase()] = "0";
              }
              return item;
            });
          });
        }

        setTableData({
          items: items || [],
          columns,
          onRenderHeader: (props, defaultRender) => defaultRender(props),
          renderItemColumn,
          onRenderRow,
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

  const renderItemColumn = useCallback((item, index, column) => {
    const fieldContent = item[column.fieldName];
    const resourceInfo = item[column.fieldName.toUpperCase()];
    switch (column.fieldName) {
      case "User Name":
        return <div className={c(t.black)}>{fieldContent}</div>;
      default:
        if (resourceInfo) {
          return (
            <span title={resourceInfo} style={{ color: "#000" }}>
              {fieldContent}
            </span>
          );
        } else {
          return (
            <span title={fieldContent} style={{ color: "#000" }}>
              {fieldContent}
            </span>
          );
        }
    }
  });

  return (
    <Stack
      id="vc-content-table-activeusers"
      horizontal
      className={c(t.w100, t.mb2)}
    >
      <Stack.Item>
        {chartData && (
          <EChart chartData={chartData} getChartOption={getChartOption} />
        )}
      </Stack.Item>
      <Stack.Item
        grow={4}
        horizontal
        className={c(t.bgWhite, t.overflowYAuto, t.overflowXHidden, "table")}
        styles={{ root: { marginBottom: 12, height: 180, minWidth: 915 } }}
      >
        {tableData && (
          <Table
            {...tableData}
            ordering={ordering}
            setOrderingCb={setOrderingCb}
          />
        )}
      </Stack.Item>
    </Stack>
  );
}

export default ActiveUsers;
