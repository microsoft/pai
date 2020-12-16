// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import React, { Suspense, lazy } from "react";
import {
  ChoiceGroup, DefaultButton, DefaultPalette, Fabric, IChoiceGroupOption, IRenderFunction,
  Label, List, Panel, PanelType, PrimaryButton, Stack, Spinner, SpinnerSize, Text, TextField, Toggle,
  initializeIcons, mergeStyleSets, StackItem,
} from "office-ui-fabric-react";
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { Modal } from 'office-ui-fabric-react/lib/Modal'
import { IconButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
const userAuth = require('../../../user/user-auth/user-auth.component');

initializeIcons();

export default class VisualEdit extends React.Component {

    constructor(props) {
        super(props);
        this.setParentState = props.setState.bind(this);
        this.parentState = props.state;
        this.setState = this.setState.bind(this);
        this.renderDynamicContent = this.renderDynamicContent.bind(this);
        this.onTextFieldInputChange = this.onTextFieldInputChange.bind(this);
        this.onDropDownSelectionChange = this.onDropDownSelectionChange.bind(this);
        this.onClickSave = this.onClickSave.bind(this);
        this.validate = props.validate.bind(this);
        this.validateParameterValue = props.validateParameterValue.bind(this);
        this.validateAllParameters = props.validateAllParameters.bind(this);
        this.props = props;
        this.parameters = {};
    }

    onTextFieldInputChange(event) {
        let validationDict = this.parentState.parameterValidatinDict;
        let valueDict = validationDict.valueDict;
        let id = event.target.id;
        let value = event.target.value;
        valueDict[id] = value;
        this.parameters[validationDict.nameDict[event.target.id]] = event.target.value;
        this.validateParameterValue(id, value);
    }

    onDropDownSelectionChange (event, value) {
        let validationDict = this.parentState.parameterValidatinDict;
        this.parameters[validationDict.nameDict[event.target.id]] = value.text;
        this.validateParameterValue(event.target.id, value.text);
    };

    onClickSave() {
        let value = this.parentState.value;
        value['parameters'] = JSON.stringify(this.parameters);
        this.setParentState({value: value});
        this.setParentState({showVisualEdit: false});
        this.validate();
    }

    renderDynamicContent() {
        let dynamicContent = [];
        for (let key in this.parentState.parameterValidatinDict.nameDict) {
            if (this.parentState.parameterValidatinDict.paramIsHiddenDict[key]) {
                continue;
            }
            let parameterName = this.parentState.parameterValidatinDict.nameDict[key];
            if (this.parentState.parameterValidatinDict.enumDict.hasOwnProperty(key) && this.parentState.parameterValidatinDict.dynaDict[key] !== 'choose') {
                let selectOptions = [];
                for (let i = 0; i < this.parentState.parameterValidatinDict.enumDict[key].length; i++) {
                    selectOptions.push({key: this.parentState.parameterValidatinDict.enumDict[key][i], text: this.parentState.parameterValidatinDict.enumDict[key][i]})
                }
                dynamicContent.push(<tr>
                    <td><IconButton iconProps={{ iconName: 'Info' }} title={this.parentState.parameterValidatinDict.paramDescDict[key]} /></td>
                    <td>{this.parentState.parameterValidatinDict.displayNameDict[key]}:</td>
                    <td><Dropdown selectedKey={this.parameters[parameterName]} onGetErrorMessage={()=>{return this.parentState.parameterValidatinDict.errorMsgDict[key]}} required={this.parentState.parameterValidatinDict.isRequiredDict[key]} name={this.parentState.parameterValidatinDict.nameDict[key]} onChange={this.onDropDownSelectionChange} id={key} options={selectOptions}></Dropdown></td>
                    <td>{this.parentState.parameterValidatinDict.describeDict.hasOwnProperty(key) ? this.parentState.parameterValidatinDict.describeDict[key] : ''}</td>
                </tr>);
            } else {
                dynamicContent.push(<tr>
                    <td><IconButton iconProps={{ iconName: 'Info' }} title={this.parentState.parameterValidatinDict.paramDescDict[key]} /></td>
                    <td>{this.parentState.parameterValidatinDict.displayNameDict[key]}:</td>
                    {/* {hard code temporarily, need refactor} */}
                    <td><TextField multiline={this.parentState.parameterValidatinDict.nameDict[key] === 'Spark_RawArgs'? true: false} onChange={this.onTextFieldInputChange} value={this.parameters[parameterName]} onGetErrorMessage={()=>{return this.parentState.parameterValidatinDict.errorMsgDict[key]}} required={this.parentState.parameterValidatinDict.isRequiredDict[key]} id={key} name={this.parentState.parameterValidatinDict.nameDict[key]} size="100"></TextField></td>
                    <td>{this.parentState.parameterValidatinDict.describeDict.hasOwnProperty(key) ? this.parentState.parameterValidatinDict.describeDict[key] : ''}</td>
                </tr>);
            }
        }
        return dynamicContent;
    }

    render() {
        //validate json format
        if (this.props.parameters) {
            try {
                this.parameters = JSON.parse(this.props.parameters)
            } catch(err) {
                this.parameters = {};
                alert('Content in \'Parameters\' field is not valid JSON format!');
            }
        }

        return(
            <div>
            <Modal isOpen={true}>
                <Stack style={{ maxWidth:"1500px", maxHeight:"1200px"}}>
                    <Stack style={{background:"#4A8EBE"}} itemsCenter="true">
                        <span style={{marginLeft:"70px", marginBottom:"8px", marginTop:"8px"}}><font size="5" color="white">{JSON.parse(this.props.moduleData.detail).name}</font></span>
                    </Stack>
                </Stack>
                <Stack style={{marginLeft:"50px", marginRight:"50px"}}>
                    <table style={{padding: '20px' }}>
                        <tbody>
                            {this.renderDynamicContent()}
                        </tbody>
                    </table>
                </Stack>
                <Stack horizontal horizontalAlign="space-evenly" style={{marginBottom:"50px"}}>
                    <StackItem>
                        <PrimaryButton id='save' text='Save' onClick={this.onClickSave}/>
                    </StackItem>
                    <StackItem>
                        <DefaultButton text='Close' onClick={()=>{this.setParentState({showVisualEdit: false})}}/>
                    </StackItem>
                </Stack>
            </Modal>
            </div>
        )
    }
}