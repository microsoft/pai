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
import Joi from 'joi-browser';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import {
  Pivot,
  PivotItem,
  Icon,
  ActionButton,
  Stack,
  getTheme,
  StackItem,
} from 'office-ui-fabric-react';
import { getFormClassNames, getTabFromStyle } from './form-style';
import { TabFormContent } from './tab-form-content';
import Card from '../../components/card';
import { TooltipIcon } from './controls/tooltip-icon';
import { PROTOCOL_TOOLTIPS } from '../utils/constants';
import {
  taskRolesSchema,
  prerequisitesSchema,
} from '../models/protocol-schema';

const TAB_ITEM_KEY_PREFIX = 'tabItem-';
const tabFormStyle = getTabFromStyle();

export class TabForm extends React.Component {
  constructor(props) {
    super(props);
    const { items } = props;

    let selectedIndex;
    if (items !== undefined && items.size !== 0) {
      selectedIndex = 0;
    }

    this.state = {
      selectedIndex: selectedIndex,
    };
  }

  _getItemKeyByIndex(index) {
    return TAB_ITEM_KEY_PREFIX + index;
  }

  _getItemIndexByKey(key) {
    return Number(key.substring(TAB_ITEM_KEY_PREFIX.length));
  }

  _onRenderItem(itemProps, defaultRender) {
    if (itemProps === undefined || defaultRender === undefined) {
      return null;
    }

    const { spacing, palette } = getTheme();
    const { items } = this.props;
    const { selectedIndex } = this.state;
    // validation
    const idx = this._getItemIndexByKey(itemProps.itemKey);
    const item = items[idx];
    const taskRolesObject = item.content.convertToProtocolFormat();
    const { error: taskRoleError } = Joi.validate(
      taskRolesObject,
      taskRolesSchema,
    );
    const dockerObject = item.content.getDockerPrerequisite();
    const { error: dockerError } = Joi.validate(
      dockerObject,
      prerequisitesSchema,
    );
    const error = taskRoleError || dockerError;

    return (
      <span style={{ position: 'relative' }}>
        {idx !== (selectedIndex || 0) && error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: spacing.s2,
              right: spacing.s2,
            }}
          >
            <div
              style={{
                height: 40,
                width: '100%',
                border: `1px solid ${palette.red}`,
              }}
            ></div>
          </div>
        )}
        <div style={{ padding: `0 ${spacing.l1}` }}>
          {defaultRender(itemProps)}
          <Icon
            iconName='Cancel'
            styles={tabFormStyle.tabIcon}
            onClick={this._onItemDelete.bind(this, itemProps.itemKey)}
          />
        </div>
      </span>
    );
  }

  _onItemsChange(updatedItems) {
    const { onItemsChange } = this.props;
    if (onItemsChange !== undefined) {
      onItemsChange(updatedItems);
    }
  }

  _onItemDelete(itemKey, event) {
    event.stopPropagation();

    if (itemKey === undefined) {
      return;
    }

    const itemIndex = this._getItemIndexByKey(itemKey);
    const { items, onItemDelete } = this.props;
    if (onItemDelete === undefined) {
      return;
    }
    const newSelectedIndex = onItemDelete(items, itemIndex);
    this.setState({
      selectedIndex: newSelectedIndex,
    });
  }

  _onItemAdd() {
    const { items, onItemAdd } = this.props;
    if (onItemAdd === undefined) {
      return;
    }
    const newSelectedIndex = onItemAdd(items);
    this.setState({
      selectedIndex: newSelectedIndex,
    });
  }

  _onLinkClick(item) {
    this.setState({
      selectedIndex: this._getItemIndexByKey(item.props.itemKey),
    });
  }

  _onContentChange(index, itemContent) {
    const { items } = this.props;
    const updatedItems = [...items];
    updatedItems[index].content = itemContent;

    this._onItemsChange(updatedItems);
  }

  render() {
    let { selectedIndex } = this.state;
    const { items, advanceFlag, isSingle } = this.props;

    const { formTabBar } = getFormClassNames();

    if (
      (selectedIndex === undefined && items.length) ||
      selectedIndex > items.length - 1
    ) {
      selectedIndex = 0;
    }

    const { spacing } = getTheme();

    return (
      <Stack styles={{ root: { minHeight: 0, flexGrow: 1 } }}>
        {!isSingle && (
          <StackItem disableShrink>
            <Stack className={formTabBar} horizontal>
              <Stack.Item styles={tabFormStyle.tabWapper}>
                <Pivot
                  onLinkClick={this._onLinkClick.bind(this)}
                  styles={{
                    text: tabFormStyle.tab.text,
                    root: tabFormStyle.tab.root,
                    link: [{ margin: 0, padding: 0 }],
                    linkIsSelected: [{ margin: 0, padding: 0 }],
                  }}
                  selectedKey={this._getItemKeyByIndex(selectedIndex)}
                >
                  {items.map((item, idx) => (
                    <PivotItem
                      key={this._getItemKeyByIndex(idx)}
                      itemKey={this._getItemKeyByIndex(idx)}
                      headerText={item.headerText}
                      onRenderItemLink={this._onRenderItem.bind(this)}
                    />
                  ))}
                </Pivot>
              </Stack.Item>
              <Stack.Item disableShrink>
                <ActionButton
                  styles={{ root: { padding: `0 ${spacing.l1}` } }}
                  iconProps={{ iconName: 'CircleAddition' }}
                  text='Add new task role'
                  onClick={this._onItemAdd.bind(this)}
                />
              </Stack.Item>
              <Stack.Item disableShrink align='stretch'>
                <Stack
                  verticalAlign='center'
                  styles={{ root: { height: '100%' } }}
                >
                  <TooltipIcon content={PROTOCOL_TOOLTIPS.taskRole} />
                </Stack>
              </Stack.Item>
            </Stack>
          </StackItem>
        )}
        <Card style={{ padding: 0, minHeight: 0, display: 'flex' }}>
          <Stack
            padding='l2 l1 0'
            styles={{ root: { overflowY: 'auto', width: '100%' } }}
          >
            <div style={{ paddingBottom: spacing.l1 }}>
              {!isNil(selectedIndex) && (
                <TabFormContent
                  key={selectedIndex}
                  jobTaskRole={items[selectedIndex].content}
                  onContentChange={this._onContentChange.bind(
                    this,
                    selectedIndex,
                  )}
                  advanceFlag={advanceFlag}
                  isSingle={isSingle}
                />
              )}
            </div>
          </Stack>
        </Card>
      </Stack>
    );
  }
}

TabForm.propTypes = {
  items: PropTypes.array.isRequired,
  onItemAdd: PropTypes.func.isRequired,
  onItemDelete: PropTypes.func.isRequired,
  onItemsChange: PropTypes.func,
  advanceFlag: PropTypes.bool,
  isSingle: PropTypes.bool,
};
