import React from 'react';
import { Customizer, Stack } from 'office-ui-fabric-react';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { TabForm, TabFormItem } from './TabForm';
import { initializeIcons } from '@uifabric/icons';
import { TabFormContent } from './TabFormContent';
import { JobTaskRole } from '../models/jobTaskRole';
import { JobInformation } from './JobInformation';
import { Parameter } from './Parameter';


initializeIcons();

export class App extends React.Component {
  constructor(props) {
    super(props);

    const items = [{headerText: 'Task role 1', content: new JobTaskRole()}];
    this.state = {
      items: items
    }
  }

  _onItemAdd() {
    const { items } = this.state;
    const updatedItems = [...items, {headerText: 'Task role X', content: new JobTaskRole()}];
    this.setState({
      items: updatedItems
    });
    return updatedItems.length - 1;
  }

  _onItemDelete(itemIndex) {
    const { items } = this.state;
    const updatedItems = items.filter((_, index) => { return index !== itemIndex;});
    this.setState({
      items: updatedItems
    });
  }

  _onContentChange(index, jobTaskRole) {
    const { items } = this.state;
    const updatedItems = [...items];
    updatedItems[index].content = jobTaskRole;
    this.setState({
      items: updatedItems
    });
  }

  _getTabFormItems(items) {
    return items.map((item, index) =>
            <TabFormItem key={index} headerText={item.headerText}>
              <TabFormContent jobTaskRole={item.content}
                              onContentChange={this._onContentChange.bind(this, index)}/>
            </TabFormItem>);
  }

  render() {
    const { items } = this.state;
    return (
      <Customizer {...FluentCustomizations}>
        <Stack horizontal>
          <Stack.Item grow={8} styles={{root: {maxWidth: '80%'}}}>
            <JobInformation/>
            <TabForm onItemAdd={this._onItemAdd.bind(this)} onItemDelete={this._onItemDelete.bind(this)}>
              {this._getTabFormItems(items)}
            </TabForm>
          </Stack.Item>
          <Stack.Item grow={3} disableShrink>
            <Parameter/>
          </Stack.Item>
        </Stack>
      </Customizer>
    );
  }
}