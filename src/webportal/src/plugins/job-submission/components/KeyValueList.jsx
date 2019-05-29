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
  }

  _renderItems(items) {
    if (items == undefined || items.length == 0) {
      return null;
    }

    return items.map((item, index) =>
      <KeyValueItem key={index} itemKey={item.itemKey} itemValue={item.itemValue} onItemDelete={this._onItemDelete.bind(this, index)}/>
    );
  }

  _onItemDelete(index) {
    const { onItemDelete } = this.props;
    if (onItemDelete === undefined) {
      return;
    }

    onItemDelete(index);
  }

  _onItemAdd() {
    const { onItemAdd } = this.props;

    if (onItemAdd === undefined) {
      return;
    }

    onItemAdd();
  }

  render() {
    const { items } = this.props;
    const itemsWithKey = this._renderItems(items);
    return (
      <Stack>
        <Stack gap={marginSize.s1}>
          {itemsWithKey}
        </Stack>
        <ActionButton iconProps={{ iconName: 'Add' }} onClick={this._onItemAdd.bind(this)}>Add</ActionButton>
      </Stack>
    );
  }
}