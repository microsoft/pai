import React from 'react'
import { Pivot, PivotItem, Icon, ActionButton } from 'office-ui-fabric-react';
import { getFormClassNames, getTabFromStyle } from './formStyle'

const TAB_ITEM_KEY_PREFIX = 'tabItem-';
const tabFormStyle = getTabFromStyle();

export class TabForm extends React.Component {
  constructor(props) {
    super(props);

    const itemsMap = new Map();
    const {items} = props;

    let itemSeq = 0;
    if (items !== undefined) {
      items.forEach(item=>this._insertItemToMap(item, itemSeq++, itemsMap));
    }

    let selectedKey = null;
    if (itemsMap.size > 0) {
      selectedKey = TAB_ITEM_KEY_PREFIX + 0;
    }

    this.state = {
      itemsMap: itemsMap,
      selectedKey: selectedKey,
      itemSeq: itemSeq
    }
  }

  _insertItemToMap(item, itemSeq, itemsMap) {
    const itemKey = TAB_ITEM_KEY_PREFIX + itemSeq;
    const newItem = {...item, itemKey: itemKey};
    itemsMap.set(itemKey, newItem);
  }

  _renderItems() {
    const pivotItems = [];
    const {itemsMap} = this.state;

    for (const item of itemsMap.values()) {
      const element = (<PivotItem key={item.itemKey}
                                  itemKey={item.itemKey}
                                  headerText={item.headerText}
                                  onRenderItemLink={this._onRenderItem.bind(this)}/>);
      pivotItems.push(element);
    }

    return pivotItems;
  }

  _onRenderItem(itemPros, defaultRender) {
    if (itemPros === undefined || defaultRender === undefined) {
      return null;
    }
  
    return (
    <span>
      { defaultRender(itemPros) }
      <Icon iconName="Cancel" styles={ tabFormStyle.tabIcon } onClick={this._onItemDelete.bind(this, itemPros.itemKey)} />
    </span>);
  }

  _onItemDelete(itemKey, event) {
    const {onItemDelete} = this.props;
    const {itemsMap} = this.state;
    if (itemKey === undefined || itemsMap === undefined) {
      return;
    }

    const currentItems = Array.from(itemsMap.values());
    const itemIndex = currentItems.findIndex(item=>item.itemKey === itemKey);
    if (itemIndex === -1) {
      console.warn('Can not get on delete item index');
      return;
    }

    let updatedItems;
    if (onItemDelete === undefined) {
      updatedItems = this._defaultOnItemDelete(itemIndex, currentItems);
    } else {
      updatedItems = onItemDelete(itemIndex, currentItems);
    }

    let itemSeq = 0;
    const updatedItemsMap = new Map();
    updatedItems.forEach(item => this._insertItemToMap(item, itemSeq++, updatedItemsMap));

    const newSelectedKey = this._getUpdatedSelectedKey(itemIndex, updatedItems.length);
    this.setState({
      itemsMap: updatedItemsMap,
      selectedKey: newSelectedKey
    });
    event.stopPropagation();
  }

  _getUpdatedSelectedKey(itemIndex, updatedItemsSize) {
    if (updatedItemsSize === 0) {
      return null;
    }

    const isRemoveLastItem = (itemIndex === updatedItemsSize);
    if (isRemoveLastItem) {
      return TAB_ITEM_KEY_PREFIX + (itemIndex - 1);
    }

    return TAB_ITEM_KEY_PREFIX + itemIndex;
  }

  _defaultOnItemDelete(itemIndex, currentItems) {
    const targetKey = currentItems[itemIndex].itemKey;
    return currentItems.filter(item=>item.itemKey !== targetKey)
  }

  _onAddItem() {
    const {onItemAdd} = this.props;
    const {itemsMap, itemSeq} = this.state;
    let newItem;
    if (onItemAdd === undefined) {
      return;
    }

    const currentItems = Array.from(itemsMap.values);
    newItem = onItemAdd(currentItems);
    newItem.itemKey = TAB_ITEM_KEY_PREFIX + itemSeq;

    itemsMap.set(newItem.itemKey, newItem);
    this.setState({
      itemsMap: itemsMap,
      selectedKey: newItem.itemKey,
      itemSeq: itemSeq + 1,
    });
  }

  _onLinkClick(item) {
    this.setState({
      selectedKey: item.props.itemKey
    });
  }

  render() {
    const {selectedKey, itemsMap} = this.state;

    const { topForm, formTabBar } = getFormClassNames();
    const elements = this._renderItems();
    return (
      <div className={topForm}>
        <div className={formTabBar}>
            <Pivot onLinkClick={this._onLinkClick.bind(this)}
                   styles={{text: tabFormStyle.tab.text, root: tabFormStyle.tab.root}}
                   selectedKey={selectedKey}>
             {elements}
            </Pivot>
            <ActionButton iconProps={{iconName: 'CircleAddition'}} text='Add new task role' onClick={this._onAddItem.bind(this)}/>
        </div>
        {selectedKey !== null? itemsMap.get(selectedKey).content: null}
      </div>
    );
  }
}