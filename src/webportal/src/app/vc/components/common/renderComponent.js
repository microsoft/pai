import React from "react";
import { getTheme } from "@uifabric/styling";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar";
import { ContextualMenuItemType } from "office-ui-fabric-react/lib/ContextualMenu";

const { spacing } = getTheme();

export const renderScrollPos = (target) => {
  const navContainerHeight = $("#content-wrapper .menu-nav").height();
  const menuNavEl = $("#content-wrapper .menu-nav");
  menuNavEl.scrollTop(target.offsetTop - navContainerHeight);
};

export const renderComboboxItems = (items, cb, name) => {
  function FilterButton({ defaultRender: Button, ...props }) {
    const {
      subMenuProps: { items },
    } = props;
    const checkedItems = items
      .filter((item) => item.checked)
      .map((item) => item.text);
    const checkedText =
      checkedItems.length === 0 ? null : checkedItems.length === 1 ? (
        <strong>{checkedItems[0]}</strong>
      ) : (
        <strong>
          {checkedItems[0]}
          {` (+${checkedItems.length - 1})`}
        </strong>
      );
    return (
      <Button key={name} {...props}>
        {checkedText}
      </Button>
    );
  }
  /**
   * @param {string} key
   * @param {string} text
   * @returns {import('office-ui-fabric-react').IContextualMenuItem}
   */
  function getItem(key) {
    return {
      key: key,
      text: key,
      canCheck: true,
      checked: name === undefined ? items[0] == key : name == key,
      onClick: cb,
    };
  }
  return {
    key: "subvirtualCluster",
    name: "sub virtual cluster",
    buttonStyles: { root: { backgroundColor: "transparent" } },
    iconProps: {
      iconName: "CellPhone",
    },
    subMenuProps: {
      items: items.map(getItem).concat([
        {
          key: "divider",
          itemType: ContextualMenuItemType.Divider,
        },
      ]),
    },
    commandBarButtonAs: FilterButton,
  };
};

export const renderCombobox = (key, options = []) => {
  if (options.length <= 0) return;
  const topBarItems = [options];
  return <CommandBar key={key} farItems={topBarItems} />;
};
