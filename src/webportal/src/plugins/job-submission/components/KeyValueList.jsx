/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React from 'react';
import {Stack, TextField, DefaultButton, DetailsList, CheckboxVisibility,
        DetailsListLayoutMode, ColumnActionsMode, Text, DetailsRow} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

const newKeyValueItem = (itemKey, itemValue, onItemDelete) => {
  return ({
    itemKey: <Text>{itemKey}</Text>,
    itemValue: <Text>{itemValue}</Text>,
    button: <DefaultButton text='Remove' onClick={onItemDelete}/>,
  });
};

export class KeyValueList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      itemKey: '',
      itemValue: '',
    };
  }

  _renderItems(items) {
    if (items == undefined || items.length == 0) {
      return [];
    }

    return items.map((item, index) => newKeyValueItem(item.itemKey,
                                                      item.itemValue,
                                                      this._onItemDelete.bind(this, index))
    );
  }

  _onItemDelete(index) {
    const {onItemDelete} = this.props;
    if (onItemDelete === undefined) {
      return;
    }

    onItemDelete(index);
  }

  _onItemAdd() {
    const {onItemAdd} = this.props;
    const item = this.state;

    if (onItemAdd === undefined) {
      return;
    }

    onItemAdd(item);
  }

  _onRenderDetailsHeader(detailsHeaderProps, defaultRender) {
    const {itemKey, itemValue} = this.state;
    return (
      <Stack>
        {defaultRender(detailsHeaderProps)}
        <DetailsRow
          {...detailsHeaderProps}
          columns={detailsHeaderProps.columns}
          item={{itemKey: <TextField placeholder='Enter a key...'
                                     value={itemKey}
                                     onChange = {(_, itemKey) => this.setState({itemKey: itemKey})}/>,
                 itemValue: <TextField placeholder='Enter a value...'
                                       value={itemValue}
                                       onChange = {(_, itemValue) => this.setState({itemValue: itemValue})}/>,
                 button: <DefaultButton text='Add' onClick={this._onItemAdd.bind(this)}/>}}
          itemIndex={-1}
        />
      </Stack>
    );
  }

  render() {
    const {items} = this.props;
    const dataItems= this._renderItems(items);

    const columns = [{key: 'column1', name: 'Key', fieldName: 'itemKey'},
                     {key: 'column2', name: 'Value', fieldName: 'itemValue'},
                     {key: 'column3', fieldName: 'button', columnActionsMode: ColumnActionsMode.disabled}];
    return (
      <Stack>
        <DetailsList items={dataItems}
                     columns={columns}
                     checkboxVisibility={CheckboxVisibility.hidden}
                     layoutMode={DetailsListLayoutMode.fixedColumns}
                     onRenderDetailsHeader={this._onRenderDetailsHeader.bind(this)}
                     compact/>
      </Stack>
    );
  }
}

KeyValueList.propTypes = {
  items: PropTypes.array,
  onItemDelete: PropTypes.func,
  onItemAdd: PropTypes.func,
};
