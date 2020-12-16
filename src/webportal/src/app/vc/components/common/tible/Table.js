import React, { useState, useEffect, useContext } from "react";
import cuid from "cuid";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import {
  DetailsList,
  SelectionMode,
} from "office-ui-fabric-react/lib/DetailsList";

function Table(props) {
  const {
    items = [],
    columns = [],
    label = "",
    onRenderHeader = () => {},
    labelClassName = {},
    renderItemColumn,
    onRenderRow,
    index,
    ordering,
    setOrderingCb = () => {},
  } = props;
  const [columnHeaders, setColumnHeaders] = useState(columns || []);
  const [itemList, setItemList] = useState(items || []);

  const onColumnClick = (event, column) => {
    if (ordering) {
      const { field, descending, stringAscending } = ordering;
      if (field === column.key) {
        setOrderingCb(field, !descending, !stringAscending);
      } else {
        setOrderingCb(column.key, descending, stringAscending);
      }
    }
  };

  function applySortProps(column) {
    column.isSorted = ordering.field === column.key;
    column.isSortedDescending = ordering.descending;
    column.onColumnClick = onColumnClick;
    // column.className = FontClassNames.small;
    // column.headerClassName = [FontClassNames.small, t.bgLightGray];
    return column;
  }

  useEffect(() => {
    if (ordering) {
      setColumnHeaders(columns.map((column) => applySortProps(column)));
      setItemList(ordering.apply(items || []));
    }
  }, [columns, items, ordering]);

  return (
    <div key={index} className={c(t.flex)}>
      <div
        key={index}
        className={c(
          "table-title",
          t.fw6,
          t.flex,
          t.justifyCenter
          // ...labelClassName
        )}
        style={{ fontSize: 14 }}
      >
        {label ? label : ""}
      </div>
      {onRenderRow ? (
        <DetailsList
          items={itemList}
          columns={columnHeaders}
          setKey={"set"}
          selectionMode={SelectionMode.none}
          onRenderDetailsHeader={onRenderHeader}
          onRenderItemColumn={renderItemColumn || null}
          onRenderRow={onRenderRow}
          styles={{ root: { overflow: "hidden" } }}
        />
      ) : (
        <DetailsList
          items={itemList}
          columns={columnHeaders}
          setKey={"set"}
          selectionMode={SelectionMode.none}
          onRenderDetailsHeader={onRenderHeader}
          onRenderItemColumn={renderItemColumn || null}
          styles={{ root: { overflow: "hidden" } }}
        />
      )}
    </div>
  );
}

export default Table;
