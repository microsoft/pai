import React from 'react'
import { Pivot, PivotItem, Icon, IconButton, Stack } from 'office-ui-fabric-react';
import { getFormClassNames, getFromStyle } from './formStyle'

export class TabForm extends React.Component {
  constructor(props) {
    super(props);

    this._number = 0;
    const _itemsMap = new Map();

    props.items.forEach((item)=> {
      _itemsMap.set(item.key, item)
    });

    this.state = {
      itemsMap: _itemsMap,
      selectedKey: ""
    }
  }

  _renderItems(items) {
    const pivotItems = [];
    for (const item of items.values()) {
      const element = (<PivotItem key={item.key}
                                  itemKey={item.key}
                                  headerText={item.label}
                                  onRenderItemLink={this._onRenderItem.bind(this)}
                                  />);
      pivotItems.push(element);
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
      <Icon iconName="Cancel" styles={ tabIconStyle } />
    </span>);
  }


  _onItemDelete(itemKey, event) {
    const {enableDeleteItem, onItemDelete} = this.props;
    if (enableDeleteItem === undefined || enableDeleteItem === false) {
      return
    }

    const {items} = this.state;
    if (itemKey === undefined || items === undefined) {
      return;
    }

    let updatedItem;
    if (onItemDelete === undefined) {
      updatedItem = this._defaultOnItemDelete(itemKey, items);
    } else {
      updatedItem = onItemDelete(itemKey, items);
    }

    this.setState({
      items: updatedItem
    });
    event.stopPropagation();
  }

  _defaultOnItemDelete(itemKey, currentItems) {
    const updatedItem = currentItems.filter((item)=>item.key !== itemKey);
    return updatedItem;
  }

  _onAddItemRender(itemPros, defaultRender) {
    if (itemPros === undefined) {
      return null;
    }

    const { itemIcon } = itemPros;
    return (
      <span>
        {/* <IconButton iconProps={{iconName: itemIcon}} onClick={this._onAddItem.bind(this)}/> */}
      </span>
    );
  }

  _onAddItem(event) {
    const {headerTemplate, pageTemplate, onItemAdd} = this.props;
    const {items} = this.state;
    let updatedItems = undefined;
    if (onItemAdd !== undefined) {
      updatedItems = onItemAdd(items, headerTemplate, pageTemplate);
    } else {
      updatedItems = this._defaultOnItemAdd(items, headerTemplate, pageTemplate);
    }
    this.setState({
      items: updatedItems
    });
    event.stopPropagation();
  }

  _defaultOnItemAdd(items, headerTemplate, pageTemplate) {
    let udpatedItems = [];
    const item = {key: "k-new" + this._number, label: headerTemplate + "ss", children: pageTemplate};
    this._number++;
    if (items !== undefined) {
      udpatedItems = udpatedItems.concat(items);
    }
    udpatedItems.push(item);
    return udpatedItems;
  }

  _onLinkClick(item) {
    this.setState({
      selectedKey: item.props.itemKey
    });
  }

  render() {
    const {selectedKey, itemsMap} = this.state;

    if (this.state.itemsMap.size === 0) {
      return (<Pivot></Pivot>);
    }

    const { topForm, formTabBar } = getFormClassNames();
    const { tabStyle } = getFromStyle();
    const elements = this._renderItems(this.state.itemsMap);
    return (
      <div className={topForm}>
        <div className={formTabBar}>
            <Pivot onLinkClick={this._onLinkClick.bind(this)} styles={{text: tabStyle.text, root: tabStyle.root}}>
             {elements}
            </Pivot>
            {/* <IconButton iconProps={{iconName: 'cancel'}}/> */}
        </div>
        {selectedKey !== ''? itemsMap.get(selectedKey).children: null}
      </div>
    );
  }
}