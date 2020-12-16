import React, { useContext } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import { CommandBar } from "office-ui-fabric-react/lib/CommandBar";
import {
  TextField,
  ITextFieldStyles,
} from "office-ui-fabric-react/lib/TextField";

export default function SearchPaginator({ Context, tableProperty = [], Pagination }) {
  const { filteredJobs = [], pagination, setPagination } = useContext(Context);
  const { itemsPerPage, pageIndex } = pagination;
  const length =
    (filteredJobs && filteredJobs.length) ||
    (tableProperty && tableProperty.length) ||
    0;
  const maxPageIndex = Math.ceil(length / itemsPerPage);
  const start = itemsPerPage * pageIndex + 1;
  const end = Math.min(itemsPerPage * (pageIndex + 1), length);

  /** @type {import('office-ui-fabric-react').ICommandBarItemProps[]} */
  const farItems = [];

  /** @type {import('office-ui-fabric-react').IButtonStyles} */
  const buttonStyles = {
    root: { backgroundColor: "white" },
    rootDisabled: { backgroundColor: "white", width: 10 },
  };

  function onClickItemsPerPage(event, { key }) {
    setPagination(new Pagination(key));
  }

  function searchChange(e) {
    let selectIndex = e.target.value * 1;
    if (selectIndex == undefined || selectIndex == "") {
      return;
    } else if (selectIndex > maxPageIndex) {
      setPagination(new Pagination(pagination.itemsPerPage, maxPageIndex - 1));
    } else {
      if (selectIndex != pageIndex) {
        setPagination(new Pagination(pagination.itemsPerPage, selectIndex - 1));
      }
    }
  }

  farItems.push({
    key: "itemsPerPage",
    text: `${itemsPerPage} items per page`,
    buttonStyles,
    menuIconProps: { iconName: "ChevronUp" },
    subMenuProps: {
      items: [20, 50, 100].map((number) => ({
        key: String(number),
        text: String(number),
        onClick: onClickItemsPerPage,
      })),
    },
  });

  farItems.push({
    key: "goto",
    text: `Go to`,
    buttonStyles,
    checked: true,
    disabled: true,
  });

  /**
   * @param {number} pageIndex
   */
  function setPage(pageIndex) {
    /**
     * @param {React.MouseEvent<Button>} event
     */
    if (pageIndex < maxPageIndex) {
      return function onClick(event) {
        setPagination(new Pagination(pagination.itemsPerPage, pageIndex));
      };
    }
  }

  farItems.push({
    key: "page-previous",
    buttonStyles,
    iconProps: { iconName: "ChevronLeft" },
    iconOnly: true,
    disabled: pageIndex !== 0 ? false : true,
    onClick: setPage(pageIndex - 1),
  });

  const searchStyles = {
    fieldGroup: {
      width: 60,
      borderRadius: 2,
    },
  };

  farItems.push({
    key: "itemsSearch",
    onRender: () => {
      let value = maxPageIndex === 0 ? "" : pageIndex + 1;
      return (
        <div>
          <TextField
            styles={searchStyles}
            deferredValidationTime={200}
            onChange={searchChange}
            value={value}
          />
        </div>
      );
    },
  });

  farItems.push({
    key: `segmentation-symbols`,
    checked: false,
    onRender: () => {
      return (
        <div className={c(t.ml3)}>
          <div style={{ fontSize: 24, bottom: 10, color: "#DDD" }}>/</div>
        </div>
      );
    },
    disabled: true,
  });

  farItems.push({
    key: `page-total`,
    checked: false,
    text: String(maxPageIndex),
    buttonStyles,
    disabled: true,
  });

  farItems.push({
    key: "page-next",
    buttonStyles,
    iconProps: { iconName: "ChevronRight" },
    iconOnly: true,
    disabled:
      pageIndex !== maxPageIndex - 1 && maxPageIndex != 0 ? false : true,
    onClick: setPage(pageIndex + 1),
  });

  return (
    <CommandBar
      farItems={farItems}
      styles={{
        root: {
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
        },
      }}
    />
  );
}
