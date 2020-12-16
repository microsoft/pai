import React, { useEffect, useState, useCallback } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import cuid from "cuid";
import { throttle } from "lodash";
import Legend from "../../content/legend/Legend";
import Table from "../../common/tible/Table";
import EChart from "../../common/echarts/";
import {
  vcbg,
  overCapacity,
  menuClickBg,
  chartColors,
} from "../../common/theme";
import {
  DefaultPalette,
  Stack,
  IStackStyles,
  IStackTokens,
  IStackItemStyles,
  FontClassNames,
  Icon,
} from "office-ui-fabric-react";
import ProgressBarComponent from "../../common/ProgressBarComponent";
import {
  group,
  setTruncatedString,
  convertToToken,
  handleResourceInfo,
  filterEmptyLabel,
  dispatch,
} from "../../common/util";

function Partition({ vcData, totalResourcesConfigured, setTotalResourcesConfigured, setTotalResourcesAllocated }) {
  const [showTablesIds, setShowTablesIds] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [partitionPropertys, setPartitionPropertys] = useState();
  const [chartCase, setChartCase] = useState();

  const setChart = useCallback(() => {
    const scaleMap = [];
    const chart = {
      id: "vc-partition-chart",
      style: { width: 240, height: 180 },
      text: "Partitions",
      legendShow: "notShow",
      color: partitionPropertys.length ? "#FFF" : chartColors[0],
      chartColors: partitionPropertys.length ? chartColors.slice(1) : chartColors,
    };
    const seriesData = partitionPropertys.length
      ? partitionPropertys
          .filter((property) => property.label.charAt(0) != "*")
          .map((property) => {
            const usageScale =
              property.resourcesConfigured <= 0 || totalResourcesConfigured <= 0
                ? "0.0"
                : (
                    (property.resourcesConfigured / totalResourcesConfigured) *
                    100
                  ).toFixed(2);
            scaleMap[usageScale] =
              property.resourcesConfigured + "/" + totalResourcesConfigured;
            return {
              name: setTruncatedString(property.label.toLowerCase(), 8),
              icon: "none",
              value: usageScale,
            };
          })
      : [
          {
            name: "",
            icon: "none",
            value: "0.00",
          },
        ];
    const tooltip = {
      trigger: "item",
      formatter: function ({ value, name }) {
        const token = scaleMap[value.toString()];
        if (!token) {
          return `${value}%`;
        }
        return `${name}<br />${token}<br />${value}%`;
      },
    };

    setChartData({ chart, seriesData, tooltip });
  });

  useEffect(() => {
    try {
      setChart();
    } catch (error) {
      console.error;
    }
  }, [vcData, partitionPropertys]);

  useEffect(() => {
    try {
      let tableDatas = [];
      let totalResourcesConfigured = 0;
      let totalResourcesAllocated = 0;
      const queueName = vcData["queueName"];
      setPartitionPropertys(
        filterEmptyLabel(vcData.capacityAndResourceInfo).map((resourceInfo) => {
          let label =
            resourceInfo.label.length > 0
              ? resourceInfo.label
              : "DEFAULT_PARTITION";
          let panelID = queueName + label;
          let caretID = queueName + label + label;
          const resourcesConfigured = convertToToken(
            resourceInfo.resourcesConfigured
          );
          const resourcesAllocated = convertToToken(
            resourceInfo.resourcesAllocated,
            "max"
          );
          let usedCapacity =
            resourcesConfigured <= 0 && resourcesAllocated > 0
              ? "Infinity"
              : resourcesAllocated <= 0
              ? 0
              : ((resourcesAllocated / resourcesConfigured) * 100).toFixed(2);

          let accordionbackgroundColor =
            usedCapacity < 100 ? vcbg : overCapacity;
          let backgroundColor =
            usedCapacity < 80
              ? "rgb(91, 215, 91)"
              : usedCapacity < 100
              ? "rgb(255, 163, 51)"
              : "";
          let width =
            usedCapacity < 80
              ? usedCapacity
              : usedCapacity > 97
              ? 97
              : usedCapacity;
          tableDatas.push(setTableKeyAndValues(resourceInfo, usedCapacity));
          totalResourcesConfigured += resourcesConfigured;
          totalResourcesAllocated += resourcesAllocated;
          return {
            label,
            usedCapacity,
            panelID,
            caretID,
            resourcesAllocated,
            resourcesConfigured,
            accordionbackgroundColor,
            backgroundColor,
            width,
          };
        })
      );
      setTotalResourcesConfigured(totalResourcesConfigured);
      setTotalResourcesAllocated(totalResourcesAllocated);
      setTableData(tableDatas);
    } catch (error) {
      console.log(error);
    }
  }, [vcData]);

  const convertInfo = useCallback((info, max) => {
    if (info === undefined) {
      return 0;
    } else {
      return convertToToken(info, max);
    }
  });

  const setTableKeyAndValues = useCallback((resourceInfo, usedCapacity) => {
    const admin = JSON.parse(cookies.get("admin"));
    let columns = [{ name: "Name" }, { name: "Value" }].map(({ name }, i) => {
      return {
        key: name + i,
        fieldName: name,
        minWidth: name === "Name" ? 180 : 210,
        maxWidth: name === "Name" ? 180 : 210,
        className: FontClassNames.medium,
        headerClassName: FontClassNames.medium,
        isResizable: true,
      };
    });

    let adminItems = [
      {
        Name: "Used Capacity ( token )",
        Value: convertInfo(resourceInfo.resourcesAllocated, "max"),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesAllocated),
      },
      {
        Name: "Configured Capacity ( token )",
        Value: convertInfo(resourceInfo.resourcesConfigured),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesConfigured),
      },
      {
        Name: "Reserved Capacity ( token )",
        Value: convertInfo(resourceInfo.resourcesReserved),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesReserved),
      },
      {
        Name: "Configured Max Capacity ( token )",
        Value: convertInfo(resourceInfo.effectiveMaxResource, "max"),
        resourceInfo: handleResourceInfo(resourceInfo.effectiveMaxResource),
      },
      {
        Name: "Absolute Used Capacity",
        Value: resourceInfo.absoluteUsedCapacity.toFixed(2) + "%",
      },
      {
        Name: "Pending Request ( token )",
        Value: convertInfo(resourceInfo.resourcesPending),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesPending),
      },
      {
        Name: "Absolute Configured Capacity",
        Value: resourceInfo.absoluteCapacity.toFixed(2) + "%",
      },
      {
        Name: "Absolute Configured Max Capacity",
        Value: resourceInfo.absoluteMaxCapacity.toFixed(2) + "%",
      },
      {
        Name: "Configured Max Application Master Limit",
        Value: resourceInfo.maxAMLimitPercentage + "%",
      },
      {
        Name: "",
        Value: "",
      },
    ];

    const items = [
      {
        Name: "Used Capacity ( token )",
        Value: convertInfo(resourceInfo.resourcesAllocated, "max"),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesAllocated),
      },
      {
        Name: "Configured Capacity ( token )",
        Value: convertInfo(resourceInfo.resourcesConfigured),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesConfigured),
      },
      {
        Name: "Reserved Capacity ( token )",
        Value: convertInfo(resourceInfo.resourcesReserved),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesReserved),
      },
      {
        Name: "Pending Request ( token )",
        Value: convertInfo(resourceInfo.resourcesPending),
        resourceInfo: handleResourceInfo(resourceInfo.resourcesPending),
      },
    ];

    return {
      itemsList: admin ? group(adminItems, 5) : group(items, 2),
      columns,
      renderItemColumn,
    };
  });

  const handleClick = useCallback((clickId) => {
    if (clickId && clickId != undefined && clickId != "") {
      const index = showTablesIds.indexOf(clickId);
      if (index === -1) {
        setShowTablesIds([clickId, ...showTablesIds]);
      } else {
        let AfterRemovingclickIds = [...showTablesIds];
        AfterRemovingclickIds.splice(index, 1);
        setShowTablesIds([...AfterRemovingclickIds]);
      }
    }
  });

  const renderItemColumn = useCallback((item, index, column) => {
    const fieldContent = item[column.fieldName];
    switch (column.fieldName) {
      case "Name":
        return (
          <div key={index} title={fieldContent} className={c(t.black)}>
            {fieldContent}
          </div>
        );

      default:
        if (item.resourceInfo) {
          return (
            <span key={index} title={item.resourceInfo}>
              {fieldContent}
            </span>
          );
        } else {
          return (
            <span key={index} title={fieldContent}>
              {fieldContent}
            </span>
          );
        }
    }
  });

  const getChartOption = useCallback((charts) => {
    setChartCase(charts);
  });

  const onMouse = useCallback((e, name, type) => {
    e.stopPropagation();
    dispatch(chartCase, type)(name);
  });

  const renderTableComp = useCallback(
    ({ itemsList, columns, renderItemColumn }, i) => {
      const {
        label,
        panelID,
        accordionbackgroundColor,
        backgroundColor,
        width,
        usedCapacity,
      } = partitionPropertys[i];
      const color = chartColors[i + 1];
      const isClude = showTablesIds.includes(panelID + i);
      let renderIconName = isClude ? "ChevronUp" : "ChevronDown";
      const ConfiguredToken = itemsList[0][1]["Value"];
      const text = ConfiguredToken + " token " + usedCapacity + "%" + " Used ";
      const handleLabel = setTruncatedString(label.toLowerCase(), 8);
      return (
        <div key={cuid()} className={c(t.mb1)}>
          <div
            // key={cuid()}
            onClick={handleClick.bind(this, panelID + i)}
            className={c("table-partition-charts-label", t.flex, t.itemsCenter)}
            onMouseOver={(e) => onMouse(e, handleLabel)}
            onMouseLeave={(e) => onMouse(e, handleLabel, true)}
          >
            <div
              title={label}
              className={c(t.mr1, t.w10, t.truncate, t.flex, t.itemsCenter)}
            >
              <div style={{ color: `${color}`, marginTop: 6, marginRight: 4 }}>
                <Icon iconName="FullCircleMask" />
              </div>
              <div>{setTruncatedString(label.toLowerCase(), 8)}</div>
            </div>
            <div className={c(t.w90)}>
              <ProgressBarComponent
                label={text}
                iconName={renderIconName}
                styles={{
                  wrap: {
                    backgroundColor: "white",
                    // minWidth: 800,
                    cursor: "pointer",
                    height: 24,
                    border: `2px solid ${menuClickBg}`,
                    padding: "2px 2px 2px 2px",
                    borderRadius: 10,
                    id: i,
                  },
                  root: {
                    backgroundColor: accordionbackgroundColor,
                    marginTop: 2,
                    height: 12,
                    borderRadius: 8,
                  },
                  progressBar: {
                    root: {
                      backgroundColor: backgroundColor,
                      width: width + "%",
                      height: 12,
                    },
                    className: panelID + i,
                  },
                  label: {
                    paddingLeft: 8,
                  },
                }}
              />
            </div>
          </div>
          <div
            key={i}
            className={c(t.flex, t.itemsCenter, t.bgWhite, t.justifyBetween)}
          >
            {isClude &&
              itemsList.map((items, index) => (
                <Table
                  index={index + i}
                  key={i + "overview"}
                  items={items}
                  columns={columns}
                  renderItemColumn={renderItemColumn}
                />
              ))}
          </div>
        </div>
      );
    }
  );

  return (
    <Stack horizontal id="vc-content-table-partitions" className={c(t.w100)}>
      <Stack.Item className="vc-content-chart-partitions">
        {chartData && (
          <EChart chartData={chartData} getChartOption={getChartOption} />
        )}
      </Stack.Item>
      <Stack.Item grow={4}>
        <Stack className={c(t.overflowYAuto, t.overflowXHidden, "table")}>
          <Stack.Item>
            <Legend />
          </Stack.Item>
          <Stack.Item>{tableData && tableData.map(renderTableComp)}</Stack.Item>
        </Stack>
      </Stack.Item>
    </Stack>
  );
}

export default Partition;
