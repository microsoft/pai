import React, { Component } from "react";
import c from "classnames";
import uuid from "uuid";
import { isEmpty } from "lodash";
import t from "tachyons-sass/tachyons.scss";
import { FontClassNames, DetailsRow } from "office-ui-fabric-react";
import { convertToLowercase } from "../common/table/utils";
import AppData from "../common/appdata-context";
import TableProperty from "../common/table/TableProperty";
import { SpinnerLoading } from "../../../components/loading";
import CommonDebugTable from "../common/table/CommonDebugTable";
import SearchBar from "./SearchBar";

class Environment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      tableList: null,
      filterKey: "",
      environmentItems: [
        { runtimeInformation: "Runtime Information" },
        { sparkProperties: "Spark Properties" },
        { systemProperties: "System Properties" },
        { classpathEntries: "Classpath Entries" },
      ],
    };
    this.reload = this.reload.bind(this);
    this.renderRow = this.renderRow.bind(this);
    this.updateDom = this.updateDom.bind(this);
    this.filterInfo = this.filterInfo.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.setTableList = this.setTableList.bind(this);
    this.getappEnvInfo = this.getappEnvInfo.bind(this);
    this.renderElement = this.renderElement.bind(this);
    this.setSplitColumns = this.setSplitColumns.bind(this);
    this.setTablePropertys = this.setTablePropertys.bind(this);
    this.setFilterKeycallback = this.setFilterKeycallback.bind(this);
    this.setTableWidthCallback = this.setTableWidthCallback.bind(this);
  }

  reload() {
    this.setState({ loading: true });
    this.getappEnvInfo();
  }

  setFilterKeycallback(key) {
    this.setState({ filterKey: key });
  }

  getappEnvInfo() {
    try {
      const { appEnvInfo } = this.context.appData;
      this.setTableList(appEnvInfo);
    } catch (error) {
      this.setState({ loading: false });
      console.log(error);
    }
  }

  renderRow(props, columnIndex) {
    const customStyles = {};
    if (props) {
      customStyles.cell = { borderLeft: `1px solid #F3F2F1` };
      if (props.itemIndex & 1) {
        customStyles.root = { backgroundColor: "#FAFAFA" };
      }
      return <DetailsRow {...props} styles={customStyles} />;
    }
    return null;
  }

  setTableList(appEnvInfo) {
    const tableList = this.state.environmentItems.map((item, index) => {
      const [[key, value]] = Object.entries(item);
      const info = appEnvInfo[key];
      return {
        key,
        value,
        info,
      };
    });

    this.setState({ tableList, loading: false });
  }

  setSplitColumns(columnDataItemArray) {
    const len = columnDataItemArray.length;
    const middle = Math.floor(len >> 1);
    let columns1 = columnDataItemArray.slice(0, middle);
    const columns2 = columnDataItemArray.slice(middle);
    if (len >= 2 && middle > 0) {
      //Fixed list sorting bug
      columns1 = columns1.map((c) => ({
        "Name\xa0": c["Name"],
        "Value\xa0": c["Value"],
      }));
      if (len & 1) {
        //When two arrays are different in length, add a dummy data
        columns1.push({ "Name\xa0": null, "Value\xa0": null });
      }
    } else {
      columns1.push({ Name: null, Value: null });
    }

    return [columns2, columns1];
  }

  updateDom(el, w, c, r) {
    try {
      const headerCells = Array.from(document.querySelectorAll(el));
      const curHeaderCell = headerCells[headerCells.length - 1];
      curHeaderCell.style.width = w + 20 + "px";
      const els = Array.from(document.querySelectorAll(c));
      els
        .filter((_, i) => i & 1)
        .forEach((t) => {
          t.style.width = w + "px";
        });
      const rowW = els[0].offsetWidth;
      Array.from(document.querySelectorAll(r)).forEach((t) => {
        t.style.width = rowW + w + 20 + "px";
      });
    } catch (error) {
      console.log("Failed to update the DOM style");
    }
  }

  setTableWidthCallback([ev, w]) {
    if (ev) {
      const { key, lable } = ev;
      const prefix = `.environment-row-table-container .${lable.replace(
        /\s*/g,
        ""
      )}${key}`;
      if (key.includes("Value") || key.includes("Source")) {
        const headerClass = `${prefix} .ms-DetailsHeader-cell`;
        const cellClass = `${prefix} .ms-DetailsRow-cell`;
        const rowClass = `${prefix} .ms-DetailsRow`;
        this.updateDom(headerClass, w, cellClass, rowClass);
      }
    }
  }

  setTablePropertys(columnDataItemArray, columnHeaderArray) {
    let tables = [];
    const isSplit = Object.keys(columnDataItemArray[0]).includes("Name");
    const columnHeaderArray2 = columnHeaderArray.map((h) => ({
      ...h,
      key: h["key"] + "\xa0",
      name: h["key"] + "\xa0",
      fieldName: h["key"] + "\xa0",
    }));
    let tableProperty;
    if (isSplit) {
      columnDataItemArray = this.setSplitColumns(
        columnDataItemArray,
        columnHeaderArray
      );
      columnDataItemArray.forEach((items, index) => {
        const prefix = columnHeaderArray[index]["lable"].replace(/\s*/g, "");
        tableProperty = new TableProperty(
          index === 1 ? columnHeaderArray2 : columnHeaderArray,
          items
        );
        tableProperty.tableClass =
          index === 1
            ? prefix + columnHeaderArray2[1]["key"]
            : prefix + columnHeaderArray[1]["key"];
        tables.push(
          <React.Fragment key={index}>
            <CommonDebugTable
              disbale={true}
              tableProperty={tableProperty}
              onRenderRow={this.renderRow}
              setTableWidthCallback={this.setTableWidthCallback}
            />
          </React.Fragment>
        );
      });
    } else {
      tableProperty = new TableProperty(columnHeaderArray, columnDataItemArray);
      tableProperty.tableClass =
        columnHeaderArray[0]["lable"].replace(/\s*/g, "") +
        columnHeaderArray[1]["key"];
      tables.push(
        <React.Fragment key={uuid()}>
          <CommonDebugTable
            disbale={true}
            tableProperty={tableProperty}
            onRenderRow={this.renderRow}
            setTableWidthCallback={this.setTableWidthCallback}
          />
        </React.Fragment>
      );
    }
    return tables;
  }

  filterInfo(infos, isArr) {
    let newInfo = {};
    const { filterKey } = this.state;
    const lowerFilterKey = convertToLowercase(filterKey);
    if (isArr) {
      newInfo = infos.filter(
        (info) =>
          convertToLowercase(info["resource"]).includes(lowerFilterKey) ||
          convertToLowercase(info["source"]).includes(lowerFilterKey)
      );
    } else {
      for (const key in infos) {
        const value = infos[key];
        if (convertToLowercase(key).includes(lowerFilterKey)) {
          newInfo[key] = value;
        } else if (convertToLowercase(value).includes(lowerFilterKey)) {
          newInfo[key] = value;
        }
      }
    }

    return newInfo;
  }

  renderTable(info, lable) {
    const columnDataItemArray = [];
    const isArr = Array.isArray(info);
    let columnHeaderArray = isArr
      ? [
          {
            key: "Resource",
            minWidth: 900,
            maxWidth: 900,
            lable,
          },
          {
            key: "Source",
            minWidth: 680,
            maxWidth: 680,
            lable,
          },
        ]
      : [
          {
            key: "Name",
            minWidth: 384,
            maxWidth: 384,
            lable,
          },
          {
            key: "Value",
            minWidth: 384,
            maxWidth: 384,
            lable,
          },
        ];

    info = this.filterInfo(info, isArr);
    //step2. set table data items content
    if (!isEmpty(info)) {
      for (const key in info) {
        isArr
          ? columnDataItemArray.push({
              Resource: info[key]["resource"],
              Source: info[key]["source"],
            })
          : columnDataItemArray.push({ Name: key, Value: info[key] });
      }
      return this.setTablePropertys(columnDataItemArray, columnHeaderArray);
    }
  }

  renderElement({ value, info }, index) {
    const tableList = this.renderTable(info, value);
    return (
      <div key={index}>
        {tableList && (
          <div
            className={c(
              t.ml2,
              t.pt2,
              t.pb2,
              t.bgWhite,
            )}
          >
            <b>{value}</b>
          </div>
        )}
        <div
          className={c(
            t.flex,
            t.overflowAuto,
            "environment-row-table-container"
          )}
        >
          {tableList}
        </div>
      </div>
    );
  }

  componentDidMount() {
    void this.reload();
  }

  render() {
    const { loading, tableList, filterKey } = this.state;
    return (
      <div className={c(t.mt2, "spark-environment")}>
        {loading ? (
          <SpinnerLoading />
        ) : !tableList ? (
          <div>
            No environment data can be found on Spark history server
          </div>
        ) : (
          <div className={c(t.flex, t.flexColumn)}>
            <div
              className={c(t.selfEnd, t.mb3, t.mr3)}
              style={{ width: "30%" }}
            >
              <SearchBar
                defaultKey={filterKey}
                setKey={this.setFilterKeycallback}
              />
            </div>
            <div className={c(t.overflowYAuto, t.bgWhite)}>
              {tableList.map(this.renderElement)}
            </div>
          </div>
        )}
      </div>
    );
  }
}

Environment.contextType = AppData;

export default Environment;
