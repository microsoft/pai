import React from 'react'
import { Pivot, PivotItem, IconButton, Stack } from 'office-ui-fabric-react';
import { getFormClassNames } from './formStyle'

export class TabForm extends React.Component {
  constructor(props) {
    super(props);

    this._number = 0;
    this.state = {
      items: props.items,
    }
  }

  _renderItems(items) {
    const priotItems = items.map((item) => {
      return (
        <PivotItem itemKey={item.key} headerText={item.label} onRenderItemLink={this._onRenderItem.bind(this)}>
          {item.children}
        </PivotItem>);
    });
    return priotItems;
  }

  _onRenderItem(itemPros, defaultRender) {
    if (itemPros === undefined || defaultRender === undefined) {
      return null;
    }
  
    const element = defaultRender(itemPros);
    if (element === undefined) {
      return null;
    }
  
    return (
      <Stack horizontal>
        <Stack.Item align='center'>
          {element}
          {/* <IconButton iconProps={{ iconName: 'Cancel' }} title='delete' ariaLabel='delete' onClick={this._onItemDelete.bind(this, itemPros.itemKey)} /> */}
        </Stack.Item>
      </Stack>);
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

  render() {
    if (this.state.items === undefined) {
      return (<Pivot></Pivot>);
    }

    const { topForm, topFormBody } = getFormClassNames();
    const items = this._renderItems(this.state.items);
    return (
      <div className={topForm}>
          <Pivot>
            {items}
            <PivotItem itemIcon='Emoji2' headerText='Add new task role' onRenderItemLink={this._onAddItemRender.bind(this)}></PivotItem>
          </Pivot>
      </div>
    );
  }
}