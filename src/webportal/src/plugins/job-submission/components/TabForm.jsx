import React from 'react'
import { Pivot, PivotItem, Icon, ActionButton, Stack } from 'office-ui-fabric-react';
import { getFormClassNames, getFromStyle } from './formStyle'

const TAB_ITEM_KEY_PREFIX = 'tabItem-';

export class TabForm extends React.Component {
  constructor(props) {
    super(props);

    const itemsMap = new Map();
    let itemSeq = 0;
    let selectedKey = null;

    if (props.minCount !== undefined) {
      for (let index = 0; index < props.minCount; index++) {
        const label = this._generateLabel(props.headerTemplate, index);
        const itemKey = TAB_ITEM_KEY_PREFIX + itemSeq++;
        const item = {itemKey: itemKey, label: label, children: props.pageTemplate};
        itemsMap.set(itemKey, item);
      }
    }

    if (itemsMap.size > 0) {
      selectedKey = TAB_ITEM_KEY_PREFIX + 0;
    }

    this.state = {
      itemsMap: itemsMap,
      selectedKey: selectedKey,
      itemSeq: itemSeq
    }
  }


  _generateLabel(headerTemplate, index) {
    if (headerTemplate !== undefined) {
      return headerTemplate + " " + (index + 1);
    }
    return (index + 1);
  }

  _renderItems() {
    const pivotItems = [];
    const {itemsMap} = this.state;
    const {headerTemplate} = this.props;
    let index = 0;

    for (const item of itemsMap.values()) {
      const label = headerTemplate !== undefined? this._generateLabel(headerTemplate, index): item.label;
      const element = (<PivotItem key={item.itemKey}
                                  itemKey={item.itemKey}
                                  headerText={label}
                                  onRenderItemLink={this._onRenderItem.bind(this)}/>);
      pivotItems.push(element);
      index++;
    }

    return pivotItems;
  }

  _onRenderItem(itemPros, defaultRender) {
    if (itemPros === undefined || defaultRender === undefined) {
      return null;
    }
  
    const {tabIconStyle} = getFromStyle();
    return (
    <span>
      { defaultRender(itemPros) }
      <Icon iconName="Cancel" styles={ tabIconStyle } onClick={this._onItemDelete.bind(this, itemPros.itemKey)} />
    </span>);
  }

  _onItemDelete(itemKey, event) {
    const {onItemDelete} = this.props;
    const {itemsMap, selectedKey} = this.state;
    if (itemKey === undefined || itemsMap === undefined) {
      return;
    }

    let updatedItemsMap;
    if (onItemDelete === undefined) {
      updatedItemsMap = this._defaultOnItemDelete(itemKey, itemsMap);
    } else {
      updatedItemsMap = onItemDelete(itemKey, itemsMap);
    }

    let newSelectedKey;
    if (selectedKey == itemKey && updatedItemsMap.size > 0) {
      newSelectedKey = Array.from(updatedItemsMap.keys())[updatedItemsMap.size - 1];
    } else if (updatedItemsMap.size == 0) {
      newSelectedKey = null;
    } else {
      newSelectedKey = selectedKey;
    }

    this.setState({
      itemsMap: updatedItemsMap,
      selectedKey: newSelectedKey
    });
    event.stopPropagation();
  }

  _defaultOnItemDelete(itemKey, itemsMap) {
    const updatedItemMap = new Map(itemsMap);
    updatedItemMap.delete(itemKey);
    return updatedItemMap;
  }

  _onAddItem(event) {
    const {headerTemplate, pageTemplate, onItemAdd} = this.props;
    const {itemsMap, itemSeq} = this.state;
    let newItem;
    if (onItemAdd !== undefined) {
      newItem = onItemAdd(itemsMap, headerTemplate, pageTemplate);
    } else {
      newItem = this._defaultOnItemAdd(itemsMap, headerTemplate, pageTemplate);
    }
    newItem.itemKey = TAB_ITEM_KEY_PREFIX + itemSeq;

    itemsMap.set(newItem.itemKey, newItem);
    this.setState({
      itemsMap: itemsMap,
      selectedKey: newItem.itemKey,
      itemSeq: itemSeq + 1,
    });
  }

  _defaultOnItemAdd(itemsMap, headerTemplate, pageTemplate) {
    const label = this._generateLabel(headerTemplate, itemsMap.size);
    const children = pageTemplate === undefined? null: pageTemplate;
    const item = {label: label, children: children};
    return item;
  }

  _onLinkClick(item, event) {
    this.setState({
      selectedKey: item.props.itemKey
    });
  }

  render() {
    const {selectedKey, itemsMap} = this.state;

    const { topForm, formTabBar } = getFormClassNames();
    const { tabStyle } = getFromStyle();
    const elements = this._renderItems();
    return (
      <div className={topForm}>
        <div className={formTabBar}>
            <Pivot onLinkClick={this._onLinkClick.bind(this)}
                   styles={{text: tabStyle.text, root: tabStyle.root}}
                   selectedKey={selectedKey}>
             {elements}
            </Pivot>
            <ActionButton iconProps={{iconName: 'CircleAddition'}} text='Add new task role' onClick={this._onAddItem.bind(this)}/>
        </div>
        {selectedKey !== null? itemsMap.get(selectedKey).children: null}
      </div>
    );
  }
}