import React from 'react';
import { Stack, TextField, DefaultButton, DetailsList, CheckboxVisibility,
         DetailsListLayoutMode, ColumnActionsMode, Separator } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

const newKeyValueItem = (itemKey, itemValue, onItemDelete, onItemChange) => {
  const onChange = (propertyName, value) => {
    const item = {itemKey: itemKey, itemValue: itemValue};
    item[propertyName] = value;
    onItemChange(item);
  }

  return ({
    itemKey: <TextField placeholder={'Enter a key'} value={itemKey} onChange={(_, value)=>onChange('itemKey', value)}></TextField>,
    itemValue: <TextField placeholder={'Enter a value'} value={itemValue} onChange={(_, value)=>onChange('itemValue', value)}></TextField>,
    button: <DefaultButton text='Remove' onClick={onItemDelete}/>
  });
}

export class KeyValueList extends React.Component {
  constructor(props) {
    super(props);
  }

  _renderItems(items) {
    if (items == undefined || items.length == 0) {
      return [];
    }

    return items.map((item, index) => newKeyValueItem(item.itemKey,
                                                      item.itemValue,
                                                      this._onItemDelete.bind(this, index),
                                                      this._onItemChange.bind(this, index))
    );
  }

  _onItemChange(index, newItem) {
    const { onItemChange } = this.props;
    if (onItemChange === undefined) {
      return;
    }
    
    onItemChange(index, newItem);
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
    const dataItmes= this._renderItems(items);

    const columns = [{ key: 'column1', name: 'Key', fieldName: 'itemKey' },
                     { key: 'column2', name: 'Value', fieldName: 'itemValue'},
                     { key: 'column3', fieldName: 'button', columnActionsMode: ColumnActionsMode.disabled}];
    return (
      <Stack>
        <DetailsList items={[{ itemKey: <TextField placeholder='Enter a key...'/>,
                               itemValue: <TextField placeholder='Enter a value...'/>,
                               button: <DefaultButton text='Add' onClick={this._onItemAdd.bind(this)}/> }]}
                     columns={columns}
                     checkboxVisibility={CheckboxVisibility.hidden}
                     layoutMode={DetailsListLayoutMode.fixedColumns}
                     compact/>
        <DetailsList items={dataItmes}
                     checkboxVisibility={CheckboxVisibility.hidden}
                     layoutMode={DetailsListLayoutMode.fixedColumns}
                     isHeaderVisible={false}
                     compact/>
      </Stack>
    );
  }
}

KeyValueList.propTypes = {
  itemKey: PropTypes.string,
  itemValue: PropTypes.string,
  onItemDelete: PropTypes.func,
  onItemChange: PropTypes.func,
  onItemAdd: PropTypes.func,
};