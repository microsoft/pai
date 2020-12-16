import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import c from "classnames";
import { isNil } from "lodash";
import $ from "jquery";
import t from "tachyons-sass/tachyons.scss";
import { SelectionMode } from "office-ui-fabric-react/lib/DetailsList";
import {
  FontClassNames,
  Link,
  ShimmeredDetailsList,
} from "office-ui-fabric-react";

import TableContext from "./TableContext";
import Ordering from "./Ordering";
import SearchPagination from "../../../../job/job-view/fabric/JobList/SearchPaginator";
import Pagination from "./Pagination";
import Paginator from "./Paginator";
import Filter from "./Filter";
import KeywordSearchBox from "./KeywordSearchBox";
import * as utils from "./utils";
import "./table.css";

function CommonDebugTable(props) {
  const {
    handleClickExeId,
    handleClickStageId,
    tableProperty,
    handleClickBatchTimeId,
    onRenderRow,
    disbale,
    setTableWidthCallback
  } = props;
  const [filter, setFilter] = useState(new Filter("", tableProperty.filterKey));
  const [ordering, setOrdering] = useState(
    new Ordering(
      tableProperty.orderKey,
      tableProperty.descending,
      tableProperty.stringAscending
    )
  );
  const [pagination, setPagination] = useState(
    new Pagination(tableProperty.itemsPerPage)
  );
  const [columns, setColumns] = useState([]);
  const [items, setItems] = useState([]);
  const [tableWidth, setTableWidth] = useState();

  const context = {
    filter,
    ordering,
    pagination,
    setFilter,
    setOrdering,
    setPagination,
  };

  const getTableWidth = useCallback((bodyW) => {
    const sidebar = $(".main-sidebar");
    const siderbarW = sidebar.width();
    return sidebar.css("transform") === "none" || (bodyW >= 721 && bodyW < 1262)
      ? bodyW - siderbarW - 40
      : bodyW - 40;
  });

  $(window).resize(function () {
    if (tableWidth != $("body").width()) {
      setTableWidth(getTableWidth());
    }
  });

  useEffect(() => {
    setFilter(new Filter("", filter.filterKey));
  }, [tableProperty]);

  useEffect(() => {
    const { pageIndex } = new Pagination();
    setPagination(new Pagination(tableProperty.itemsPerPage, pageIndex));
  }, [tableProperty.itemsPerPage]);

  const onColumnClick = (event, column) => {
    const { field, descending, stringAscending } = ordering;
    if (field === column.key) {
      setOrdering(new Ordering(field, !descending, !stringAscending));
    } else {
      setOrdering(new Ordering(column.key, descending, stringAscending));
    }
  };

  function applySortProps(column) {
    column.isSorted = ordering.field === column.key;
    column.isSortedDescending = ordering.descending;
    column.onColumnClick = column.disabled ? "" : onColumnClick;
    column.className = FontClassNames.medium;
    column.headerClassName = [FontClassNames.medium, t.bgLightGray];
    column.isResizable = true;
    column.name = column.name === null ? column.key : column.name;
    column.fieldName = column.key;
    return column;
  }

  const clickExecutor = useCallback((executorId) => {
    handleClickExeId(executorId);
  });

  const clickStage = useCallback((stageId) => {
    handleClickStageId(stageId);
  });

  const clickBatchTime = useCallback((BatchTimeId, e) => {
    e.persist(); //Fixing React Warning
    handleClickBatchTimeId(Date.parse(BatchTimeId), e);
  });

  useEffect(() => {
    const tasks = pagination.apply(
      ordering.apply(filter.apply(tableProperty.columnDataItemArray || []))
    );
    if (tasks) {
      setItems(tasks);
    }
    if (tableProperty) {
      let sortProps = [];
      tableProperty.columnHeaderArray.forEach((columnHeader) => {
        if (
          columnHeader.key === "ExecutorID" &&
          handleClickExeId !== undefined &&
          !columnHeader.disabled
        ) {
          //TO BE REFACTORED
          sortProps.push(
            applySortProps({
              key: "ExecutorID",
              minWidth: 75,
              maxWidth: 75,
              fieldName: "ExecutorID",
              isSorted: ordering.field === "ExecutorID",
              onRender(items) {
                if (
                  !columnHeader.disabled &&
                  items.TaskExecutorIdExist &&
                  items.ExecutorID != "driver"
                ) {
                  return (
                    <Link onClick={() => clickExecutor(items.ExecutorID)}>
                      {items.ExecutorID}
                    </Link>
                  );
                } else {
                  return items.ExecutorID;
                }
              },
            })
          );
        } else if (
          columnHeader.key === "StageID" &&
          handleClickStageId !== undefined &&
          !columnHeader.disabled
        ) {
          sortProps.push(
            applySortProps({
              key: "StageID",
              minWidth: 75,
              maxWidth: 75,
              fieldName: "StageID",
              isSorted: ordering.field === "StageID",
              onRender(items) {
                return (
                  <Link onClick={() => clickStage(items.StageID)}>
                    {items.StageID}
                  </Link>
                );
              },
            })
          );
        } else if (
          columnHeader.key === "BatchTime" &&
          handleClickBatchTimeId !== undefined &&
          !columnHeader.disabled
        ) {
          sortProps.push(
            applySortProps({
              key: "BatchTime",
              minWidth: 175,
              maxWidth: 175,
              fieldName: "BatchTime",
              isSorted: ordering.field === "BatchTime",
              onRender(items) {
                return (
                  <Link
                    onClick={(e) =>
                      clickBatchTime.call(this, items.BatchTime, e)
                    }
                  >
                    {items.BatchTime}
                  </Link>
                );
              },
            })
          );
        }else if(
          columnHeader.key === "Error" &&
          handleClickExeId !== undefined &&
          !columnHeader.disabled
        ){
          sortProps.push(
            applySortProps({
              key: "Error",
              minWidth: 50,
              maxWidth: 75,
              fieldName: "Error",
              isSorted: ordering.field === "Error",
              onRender(items) {
                return (
                  <span title={items.Error}>{items.Error}</span>
                );
              },
            })
          );
        } else {
          sortProps.push(applySortProps(columnHeader));
        }
      });
      setColumns(sortProps);
    }
  }, [
    ordering,
    pagination.itemsPerPage,
    pagination.pageIndex,
    tableProperty.columnDataItemArray,
    filter,
    tableProperty.itemsPerPage,
  ]);

  const setTable = useCallback((...args) => {
    // Set table header to be fixed
    if (setTableWidthCallback) {
      setTableWidthCallback(args)
      return;
    }
    const tableClass = "." + tableProperty.tableClass;
    utils.setTableScrllbar(items.length, tableClass, "", tableWidth);
  });
   
  useEffect(() => setTable(), [items.length, pagination, tableWidth]);

  return tableProperty.columnDataItemArray ? (
    <TableContext.Provider value={context}>
      <div className={c(t.mb3, tableProperty.tableClass)}>
        {tableProperty.isShortTable ? (
          <div></div>
        ) : (
          !disbale && <div
            className={c(
              t.bgWhite,
              t.bb,
              t.flex,
              t.itemsCenter,
              t.justifyBetween
            )}
          >
            <div
              className={c(
                t.bgWhite,
                t.pl3,
                t.mt3,
                t.flex,
                t.itemsCenter,
                t.justifyBetween
              )}
            >
              <div className={c(t.flex, t.itemsCenter)}>
                <div>
                  Total (
                  {filter.apply(tableProperty.columnDataItemArray).length})
                </div>
                <KeywordSearchBox />
              </div>
              <div>
                <SearchPagination
                  Pagination={Pagination}
                  Context={TableContext}
                  tableProperty={filter.apply(
                    tableProperty.columnDataItemArray
                  )}
                />
              </div>
            </div>
          </div>
        )}
        {filter.apply(tableProperty.columnDataItemArray).length <= 0 ? (
          <div
            className={c(
              // t.f2,
              t.vh25,
              t.bgWhite,
              t.flex,
              t.itemsCenter,
              t.justifyCenter
            )}
          >
            <span>No results matched your search.</span>
          </div>
        ) : (
          onRenderRow ? 
            <ShimmeredDetailsList
            items={items}
            setKey="key"
            columns={columns}
            enableShimmer={isNil(items)}
            shimmerLines={pagination.itemsPerPage}
            selectionMode={SelectionMode.none}
            onColumnResize={setTable}
            onRenderRow={onRenderRow}
          /> :
          <ShimmeredDetailsList
            items={items}
            setKey="key"
            columns={columns}
            enableShimmer={isNil(items)}
            shimmerLines={pagination.itemsPerPage}
            selectionMode={SelectionMode.none}
            onColumnResize={setTable}
          />
        )}
      </div>
    </TableContext.Provider>
  ) : (
    <div>no data </div>
  );
}

export default CommonDebugTable;
