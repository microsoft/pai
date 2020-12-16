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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

import ReactDOM from 'react-dom';
import React, {useContext, useMemo, useLayoutEffect, useCallback, useEffect, useState} from 'react';
import { Stack, StackItem, TextField, Label } from 'office-ui-fabric-react';
import { Modal } from 'office-ui-fabric-react/lib/Modal'
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { ScrollablePane } from 'office-ui-fabric-react/lib/ScrollablePane';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { IconButton } from 'office-ui-fabric-react/lib/Button';

export default class JobSubmitContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = props.state;
        this.uploadFile = React.createRef();
        this.setState = props.setState.bind(this);
        this.renderDynamicContent = this.renderDynamicContent.bind(this);
        this.handleValueSelectionChange = this.handleValueSelectionChange.bind(this);
        this.handleInputTypeSelectionChange = this.handleInputTypeSelectionChange.bind(this);
        this.clickSelectFile = this.clickSelectFile.bind(this);
        this.onFileChange = this.onFileChange.bind(this);
        this.validateParameters = this.validateParameters.bind(this);
        this.handleParaChange = this.handleParaChange.bind(this);
        this.initValidationVariables = this.initValidationVariables.bind(this);
        this.initValidationVariables();
        this.validateParameters();
    }

    clickSelectFile() {
        this.uploadFile.current.click();
    }

    onFileChange(e) {
        this.state.fileDict[e.target.id] = e.target.files[0];
        let fileNameDict = this.state.fileNameDict;
        let validDict = this.state.isValidDict;
        fileNameDict[e.target.id] = e.target.files[0].name;
        validDict[e.target.id] = true;
        this.setState({isValidDict: validDict});
        this.setState({fileNameDict: fileNameDict});
        this.validateParameters();
    }

    handleValueSelectionChange (event, value) {
        let valueDict = this.state.valueDict;
        let validDict = this.state.isValidDict;
        valueDict[event.target.id] = value.text;
        validDict[event.target.id] = true;
        this.setState({valueDict: valueDict});
        this.setState({isValidDict: validDict});
        this.validateParameters();
    };

    handleInputTypeSelectionChange (event, value) {
        let inputTypeDict = this.state.inputTypeDict;
        inputTypeDict[event.target.id] = value.text;
        this.setState({inputTypeDict: inputTypeDict});
    };
    
    initValidationVariables() {
        let validDict = this.state.isValidDict;
        let errorDict = this.state.errorMsgDict;
        for (let key in this.state.nameDict) {
            if (!this.state.valueDict[key] && this.state.isRequiredDict[key]) {
                validDict[key] = false;
                errorDict[key] = 'value could not be empty!'
            }
        }
        this.setState({isValidDict: validDict});
        this.setState({errorMsgDict: errorDict});
    }

    validateParameters() {
        for(let key in this.state.isValidDict) {
            if(!this.state.isValidDict[key]) {
                this.state.validationPass = false;
                this.setState({validationPass: false});
                return;
            }
        }
        this.state.validationPass = true;
        this.setState({validationPass: true});
    }

    handleParaChange(event) {
        let valueDict = this.state.valueDict;
        let id = event.target.id;
        let value = event.target.value;
        valueDict[id] = value;
        this.setState({valueDict: valueDict});
        let errorDict = this.state.errorMsgDict;
        let validDict = this.state.isValidDict;
        if (value === '' && this.state.isRequiredDict[id]) {
            errorDict[id] = 'value could not be empty!'
            validDict[id] = false;
        }  else {
            if(this.state.describeDict.hasOwnProperty(id)) {
                let rangeStrs = this.state.describeDict[id].toString().match(/\[.*?\]/g);
                if(rangeStrs && rangeStrs.length) {
                    let numRangeStr = rangeStrs[0].slice(1, -1).split(',');
                    let lowNum = Number(numRangeStr[0]);
                    let highNum = Number(numRangeStr[1]);
                    let valueNum = Number(value);
                    if(isNaN(valueNum)) {
                        errorDict[id] = 'value should be a number!';
                        validDict[id] = false;
                    } else if(valueNum < lowNum || (!isNaN(highNum) && valueNum > highNum)) {
                            if(isNaN(highNum)) {
                                highNum = '...';
                            }
                            errorDict[id] = `value should in a range of [${lowNum}, ${highNum}] !`;
                            validDict[id] = false;
                    } else {
                        validDict[id] = true;
                        errorDict[id] = '';
                    }
                }
            } else {
                validDict[id] = true;
                errorDict[id] = '';
            }
        }
        this.setState({isValidDict: validDict});
        this.setState({errorMsgDict: errorDict});
        this.validateParameters();
    }

    renderDynamicContent() {
        let dynamicContent = [];
        dynamicContent.push(<tr>
            <td><IconButton iconProps={{ iconName: 'Info' }} title={'parameter: frameworkId'} /></td>
            <td>Framework Name:</td>
            <td><TextField onChange={this.handleParaChange} id='frameworkId' name='FrameworkId' placeholder="<auto>" size="100"></TextField></td>
        </tr>);
        for (let key in this.state.nameDict) {
            if (this.state.paramIsHiddenDict[key]) {
                continue;
            }
            if (this.state.enumDict.hasOwnProperty(key)) {
                let selectOptions = [];
                for (let i = 0; i < this.state.enumDict[key].length; i++) {
                    selectOptions.push({key: this.state.enumDict[key][i], text: this.state.enumDict[key][i]})
                }
                if (this.state.dynaDict[key] === 'choose') {
                    dynamicContent.push(<tr>
                        <td><IconButton iconProps={{ iconName: 'Info' }} title={this.state.paramDescDict[key]} /></td>
                        <td>{this.state.displayNameDict[key]}:</td>
                        <td>
                        <Stack horizontal tokens={{childrenGap: 10}}>
                            <Stack.Item>
                                <Dropdown selectedKey={this.state.inputTypeDict[key]} onChange={this.handleInputTypeSelectionChange} name={this.state.nameDict[key]} id={key} options={selectOptions}></Dropdown>
                            </Stack.Item>
                            {
                                this.state.inputTypeDict[key] === 'local path' && 
                                (<Stack.Item>
                                    <Stack horizontal tokens={{childrenGap: 10}}>
                                        <DefaultButton onClick={this.clickSelectFile} text={'Select File'}></DefaultButton>
                                        <input ref={this.uploadFile} type='file' style={{display: 'none'}} id={key} onChange={this.onFileChange}></input>
                                        <Label>{this.state.fileNameDict[key]}</Label>
                                    </Stack>
                                </Stack.Item>)
                            }
                            {
                                this.state.inputTypeDict[key] === 'remote path' && 
                                (<Stack.Item>
                                    <TextField onChange={this.handleParaChange} value={this.state.valueDict[key]} onGetErrorMessage={()=>{return this.state.errorMsgDict[key]}} required={this.state.isRequiredDict[key]} id={key} name={this.state.nameDict[key]} size="100"></TextField>
                                </Stack.Item>)
                            }
                        </Stack> 
                        </td>
                        <td>{this.state.describeDict.hasOwnProperty(key) ? this.state.describeDict[key] : ''}</td>
                    </tr>);
                } else {
                    dynamicContent.push(<tr>
                        <td><IconButton iconProps={{ iconName: 'Info' }} title={this.state.paramDescDict[key]} /></td>
                        <td>{this.state.displayNameDict[key]}:</td>
                        <td><Dropdown selectedKey={this.state.valueDict[key]} onGetErrorMessage={()=>{return this.state.errorMsgDict[key]}} required={this.state.isRequiredDict[key]} name={this.state.nameDict[key]} onChange={this.handleValueSelectionChange} id={key} options={selectOptions}></Dropdown></td>
                        <td>{this.state.describeDict.hasOwnProperty(key) ? this.state.describeDict[key] : ''}</td>
                    </tr>);
                }
            } else {
                dynamicContent.push(<tr>
                    <td><IconButton iconProps={{ iconName: 'Info' }} title={this.state.paramDescDict[key]} /></td>
                    <td>{this.state.displayNameDict[key]}:</td>
                    {/* {hard code temporarily, will refactor later} */}
                    <td><TextField multiline={this.state.nameDict[key] === 'Spark_RawArgs'? true: false} onChange={this.handleParaChange} value={this.state.valueDict[key]} onGetErrorMessage={()=>{return this.state.errorMsgDict[key]}} required={this.state.isRequiredDict[key]} id={key} name={this.state.nameDict[key]} size="100"></TextField></td>
                    <td>{this.state.describeDict.hasOwnProperty(key) ? this.state.describeDict[key] : ''}</td>
                </tr>);
            }
        }
        return dynamicContent;        
    }

    render() {
        let dynamicContent = this.renderDynamicContent();
        return (
            <Stack style={{marginLeft:"50px", marginRight:"50px"}}>
            <table style={{padding: '20px', 'borderCollapse': 'separate', 'borderSpacing': '20px 20px' }}>
                <tbody>
                    {dynamicContent}
                </tbody>
            </table>
        </Stack>
        )
    }
}