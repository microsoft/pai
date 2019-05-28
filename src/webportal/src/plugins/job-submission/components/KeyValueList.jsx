import React from 'react';
import { Stack, ActionButton, TextField, IconButton } from 'office-ui-fabric-react';
import { marginSize } from './formStyle';

const KeyValueItem = (props) => {
  const { itemKey, itemValue, onItemDelete } = props;
  return (
  <Stack horizontal gap={marginSize.s1}>
    <TextField placeholder={'Enter a key'} value={itemKey}></TextField>
    <TextField placeholder={'Enter a value'} value={itemValue}></TextField>
    <IconButton iconProps={{ iconName: 'Clear' }} onClick={onItemDelete}/>
  </Stack>);
}

export class KeyValueList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      items: props.items
    };
  }

  _renderItems() {
    const { items } = this.state;

    if (items == undefined || items.length == 0) {
      return null;
    }

    return items.map(item =>
      <KeyValueItem key={item.key} itemKey={item.itemKey} itemValue={item.itemValue} onItemDelete={this._onItemDelete.bind(this, item)}/>
    );
  }

  _updatedItemKeys(items) {
    const updatedItems = Array.from(items);
    let index = 0;
    updatedItems.forEach(item=>item.key = index++);
    return updatedItems;
  }

  _onItemDelete(item) {
    const { items } = this.state;
    const { onItemDelete } = this.props;
    let updatedItems;
    if (onItemDelete === undefined) {
      updatedItems = this._defaultOnItemDelete(item.key, items)
    } else {
      updatedItems = onItemDelete(item.key, items);
    }

    updatedItems = this._updatedItemKeys(updatedItems);
    this.setState({
      items: updatedItems
    });
  }

  _defaultOnItemDelete(index, items) {
    const updatedItems = Array.from(items);
    if (updatedItems.splice(index, 1).length !== 1) {
      console.warn('Failed to delete item from items list');
    }
    return updatedItems;
  }

  _onItemAdd() {
    const { items } = this.state;
    const { onItemAdd } = this.props;

    const itemsLength = items == undefined ? 0 : items.length;
    let newItem = {key: itemsLength, itemKey: undefined, itemValue: undefined};
    if (onItemAdd !== undefined) {
      newItem = onItemAdd(items);
    }

    let updatedItems = (items === undefined) ? [] : Array.from(items);
    updatedItems.push(newItem);
    this.setState({
      items: updatedItems
    });
  }

  render() {
    const items = this._renderItems();
    return (
      <Stack>
        <Stack gap={marginSize.s1}>
          {items}
        </Stack>
        <ActionButton iconProps={{ iconName: 'Add' }} onClick={this._onItemAdd.bind(this)}>Add</ActionButton>
      </Stack>
    );
  }
}