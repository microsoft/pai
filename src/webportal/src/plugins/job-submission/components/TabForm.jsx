import React from 'react'
import { Pivot, PivotItem, Icon, ActionButton } from 'office-ui-fabric-react';
import { getFormClassNames, getTabFromStyle } from './formStyle'

const TAB_ITEM_KEY_PREFIX = 'tabItem-';
const tabFormStyle = getTabFromStyle();

export const TabFormItem = (props) => {
  return (
    <>{props.children}</>
  );
}

export class TabForm extends React.Component {
  constructor(props) {
    super(props);
    const { children } = props;
    
    let selectedIndex;
    if (children !== undefined && children.size !== 0) {
      selectedIndex = 0;
    }

    this.state = {
      selectedIndex: selectedIndex,
    }
  }

  _getItemKeyByIndex(index) {
    return TAB_ITEM_KEY_PREFIX + index;
  }

  _getItemIndexByKey(key) {
    return Number(key.substring(TAB_ITEM_KEY_PREFIX.length));
  }

  _getContentItemsFromChildren(children) {
    return React.Children.map(children, (child, index) => {
      const {headerText, children} = child.props;
      return { headerText: headerText, content: children, itemKey: this._getItemKeyByIndex(index) }
    })
  }

  _renderItems(items) {
    const pivotItems = items.map(items => 
                         <PivotItem key={items.itemKey}
                                         itemKey={items.itemKey}
                                         headerText={items.headerText}
                                         onRenderItemLink={this._onRenderItem.bind(this)}/>);

    return pivotItems;
  }

  _onRenderItem(itemPros, defaultRender) {
    if (itemPros === undefined || defaultRender === undefined) {
      return null;
    }
  
    return (
    <span>
      { defaultRender(itemPros) }
      <Icon iconName="Cancel"
            styles={ tabFormStyle.tabIcon }
            onClick={this._onItemDelete.bind(this, itemPros.itemKey)} />
    </span>);
  }

  _onItemDelete(itemKey, event) {
    const {onItemDelete} = this.props;
    event.stopPropagation();

    if (itemKey === undefined) {
      return;
    }

    const itemIndex = this._getItemIndexByKey(itemKey);
    if (onItemDelete === undefined) {
      return;
    }
  
    const newSelectedIndex = onItemDelete(itemIndex);
    this.setState({
      selectedIndex: newSelectedIndex
    });
  }

  _onAddItem() {
    const { onItemAdd } = this.props;
    if (onItemAdd === undefined) {
      return;
    }

    const newSelectedIndex = onItemAdd();
    if (newSelectedIndex === undefined) {
      return;
    }

    this.setState({
      selectedIndex: newSelectedIndex
    });
  }

  _onLinkClick(item) {
    this.setState({
      selectedIndex: this._getItemIndexByKey(item.props.itemKey)
    });
  }

  render() {
    let { selectedIndex } = this.state;
    const { children } = this.props;

    const { topForm, formTabBar } = getFormClassNames();
    const items = this._getContentItemsFromChildren(children);
    const elements = this._renderItems(items);

    if (selectedIndex === undefined && items.length) {
      selectedIndex = 0;
    }

    return (
      <div className={topForm}>
        <div className={formTabBar}>
            <Pivot onLinkClick={this._onLinkClick.bind(this)}
                   styles={{text: tabFormStyle.tab.text, root: tabFormStyle.tab.root}}
                   selectedKey={this._getItemKeyByIndex(selectedIndex)}>
             {elements}
            </Pivot>
            <ActionButton iconProps={{iconName: 'CircleAddition'}} text='Add new task role' onClick={this._onAddItem.bind(this)}/>
        </div>
        {selectedIndex !== undefined? items[selectedIndex].content: null}
      </div>
    );
  }
}