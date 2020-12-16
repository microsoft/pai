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
import config from '../../../config/webportal.config';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import VisualEdit from './VisualEdit'
import {defaultRestServerClient} from '../../../common/http-client';
import * as userAuth from '../../../user/user-auth/user-auth.component';
import parseInfo from '../../../mt-job-submission/utils/parseModuleInfo'

const styles = mergeStyleSets({
    form: {
      width: "60%",
      marginTop: "20px",
      alignSelf: "center",
      boxSizing: "border-box",
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
      borderStyle: "1px solid rgba(0, 0, 0, 0.2)",
      borderRadius: "6px",
      backgroundColor: DefaultPalette.white,
    },

    title: {
      fontWeight: "600",
    },

    subTitle: {
      fontSize: "16px",
      fontWeight: "300",
      color: DefaultPalette.neutralSecondary,
    },
  
    header: {
      width: "80%",
      paddingBottom: "20px",
      borderBottom: `1px solid ${DefaultPalette.neutralLight}`,
    },
  
    footer: {
      width: "80%",
      paddingTop: "20px",
      borderTop: `1px solid ${DefaultPalette.neutralLight}`,
    },

    item: {
      width: "80%",
    },
    
    text: {
      width: "10%",
      paddingLeft: "5%",
      paddingRight: "5%"
    },

    textField: {
      width: "85%",
      paddingLeft: "5%"
    },

    dropDown: {
      width: "610px",
    },

    stack: {
      paddingTop: "5%"
    },
  
    fileItem: {
      width: "90%",
      padingRight: "5%",
    },
  });
initializeIcons();

export default class Form extends React.Component {

    constructor(props) {
        super(props);
        this.selectFile = React.createRef();
        this.moduleIdList = props.moduleIdList;
        this.moduleDict = props.moduleDict;
        this.clickSelectFile = this.clickSelectFile.bind(this);
        this.state = {
            value: { name: '', category: '', group: '', description: '', moduleId: this.moduleIdList[0], parameters: ''},
            fileName: '',
            displayFileName: '', //If file is valid, will set displayFileName = fileName
            fileObject: null, //The file object imported from local
            isUploading: false, //If it is uploading example data
            showResultDialog: false, //show create/update result dialog
            showConfirmDialog: false, //show override confim dialog
            showVisualEdit: false, //show visual edit dialog
            createSuccess: false, //create example success
            createResultText: '', //The result returned from restserver
            valid: false,
            parameterValid: false,
            moduleData: '',
            isDownloadingExampleData: false, //If it is downloading example data when update example, used to initialize data
            parameterValidatinDict: {
                nameDict: {}, defaultDict: {}, enumDict: {}, describeDict: {}, dynaDict: {}, inputTypeDict: {},
                fileNameDict: {}, fileDict: {}, errorMsgDict: {}, displayNameDict: {}, paramDescDict: {}, paramIsHiddenDict: {},
                isRequiredDict: {}, isValidDict: {}, valueDict: {}, validationPass: false
            }
        }
        this.userAlias = '';
        this.onFileChange = this.onFileChange.bind(this);
        this.setState = this.setState.bind(this);
        this.readFileContent = this.readFileContent.bind(this);
        this.parseFileContent = this.parseFileContent.bind(this);
        this.onClickCreate = this.onClickCreate.bind(this);
        this.postExampleCreate = this.postExampleCreate.bind(this);
        this.initUser = this.initUser.bind(this);
        this.onTextFieldChange = this.onTextFieldChange.bind(this);
        this.onDropDownSelectionChange = this.onDropDownSelectionChange.bind(this);
        this.validate = this.validate.bind(this);
        this.assignFileContent = this.assignFileContent.bind(this);
        this.onClickVisualEdit = this.onClickVisualEdit.bind(this);
        this.initModuleIdList = this.initModuleIdList.bind(this);
        this.validateParameterValue = this.validateParameterValue.bind(this);
        this.setShowExampleManagement = props.setShowExampleManagement.bind(this);
        this.validateAllParameters = this.validateAllParameters.bind(this);
        this.confirm = false;
        this.initUser();
        this.moduleIdSelectOptions = this.initModuleIdList(props.moduleIdList);
    }

    componentDidMount() {
        if (this.props.ActionType === 'Update') {
            let exampleInfoUri = `/api/v2/mp/examples/${this.props.ExampleId}`;
            defaultRestServerClient.get(exampleInfoUri).then((response) => {
                let dataObject = JSON.parse(response.data);
                let value = {};
                value['name'] = dataObject.info.name;
                value['category'] = dataObject.info.category;
                value['group'] = dataObject.info.group;
                value['description'] = dataObject.info.description;
                value['moduleId'] = dataObject.info.moduleId;
                value['parameters'] = JSON.stringify(dataObject.parameters);
                this.setState({value});
                this.validate();
            }).catch((err) => {
                if (err.response) {
                    alert(err.response.data.message);
                } else {
                    alert(err.message);
                }
            });
        }
    }

    initUser() {
        var cookie = document.cookie.toString();
        cookie += ';';
        var matchResult = cookie.match(/user=.*?;/);
        if (matchResult) {
            this.userAlias = matchResult.toString().slice(5, -1);
        } else {
            alert('Cannot find user alias in cookie!');
        }
    }

    initModuleIdList(moduleIdList) {
        let moduleIdSelectOptions = [];
        for (let index = 0; index < moduleIdList.length; index++) {
            moduleIdSelectOptions.push({key: moduleIdList[index], text: `${this.moduleDict[moduleIdList[index]].name} : ${this.moduleDict[moduleIdList[index]].version}`})
        }
        return moduleIdSelectOptions;
    }

    clickSelectFile() {
        this.selectFile.current.click();
    }

    onFileChange(e) {
        let fileName = e.target.files[0].name;
        this.readFileContent(e.target.files[0]).then(content => {
            try {
                let jsonObj = JSON.parse(content);
                this.setState({fileObject: jsonObj});
                this.setState({fileName: fileName});
                this.parseFileContent();
            } catch (err) {
                alert(`${fileName} format error, not a valid json file!`);
            }
        }).catch(error => alert(error))
    }

    assignFileContent() {
        let valueDict = this.state.value;
        if (this.state.fileObject.hasOwnProperty('info')) {
            let keyList = ['name', 'group', 'category', 'description', 'moduleId'];
            for (let key of keyList) {
                if (this.state.fileObject.info.hasOwnProperty(key)) {
                    valueDict[key] = this.state.fileObject.info[key];
                }
            }
        }
        if (this.state.fileObject.hasOwnProperty('parameters')) {
            valueDict['parameters'] = JSON.stringify(this.state.fileObject.parameters);
        }
        this.setState({value: valueDict});
        this.validate();
    }    

    parseFileContent() {
        try {
            if (this.state.fileObject.hasOwnProperty('info')) {
                let keyList = ['name', 'group', 'category', 'description'];
                for (let key of keyList) {
                    if (this.state.fileObject.info.hasOwnProperty(key) && this.state.value[key]) {
                        this.setState({showConfirmDialog: true});
                        return;
                    }
                }
            }
            if (this.state.fileObject.hasOwnProperty('parameters')) {
                //validate json format
                JSON.stringify(this.state.fileObject.parameters);
                if (this.state.value['parameters']) {
                    this.setState({showConfirmDialog: true});
                    return;
                }
            }
            this.assignFileContent();
            this.setState({displayFileName: this.state.fileName});
        } catch(err) {
            alert(err);
        }
    }

    readFileContent(file) {
        const reader = new FileReader()
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result)
            reader.onerror = error => reject(error)
            reader.readAsText(file)
      });
    }

    onClickCreate() {
        let moduleDetailUri = `/api/v2/mp/modules/${this.state.value.moduleId}`;
        defaultRestServerClient.get(moduleDetailUri).then((response) => {
            [this.state.parameterValidatinDict.nameDict, this.state.parameterValidatinDict.defaultDict, this.state.parameterValidatinDict.enumDict, this.state.parameterValidatinDict.describeDict, this.state.parameterValidatinDict.dynaDict, this.state.parameterValidatinDict.inputTypeDict,
                this.state.parameterValidatinDict.fileNameDict, this.state.parameterValidatinDict.errorMsgDict, this.state.parameterValidatinDict.displayNameDict, this.state.parameterValidatinDict.paramDescDict, this.state.parameterValidatinDict.paramIsHiddenDict, 
                this.state.parameterValidatinDict.isRequiredDict, this.state.parameterValidatinDict.isValidDict] = parseInfo(response.data);
            this.setState({
                moduleData: response.data,
            });
            if (!this.validateAllParameters()) {
                return;
            }
            this.setState({isUploading: true});
            let data = {
                info: {
                    'name': this.state.value['name'],
                    'group': this.state.value['group'],
                    'category': this.state.value['category'],
                    'description': this.state.value['description'],
                    'moduleId': this.state.value['moduleId'],
                    'owner': this.userAlias
                },
                parameters: this.state.value['parameters']
            };
            
            if (this.props.ActionType === 'Create') { 
                this.postExampleCreate(data);
            } else {
                this.postExampleUpdate(data, this.props.ExampleId);
            }
        }).catch((err) => {
            alert(err.response.data.message);
        });
    }

    onTextFieldChange(event) {
        let key = event.target.id;
        let value = event.target.value;
        let valueDict = this.state.value;
        valueDict[key] = value;
        this.setState({value: valueDict});
        this.validate();
    }

    onDropDownSelectionChange (event, value) {
        // this.parameters[event.target.id] = value.text;
        let valueDict = this.state.value;
        valueDict[event.target.id] = value.key;
        this.setState({value: valueDict});
        this.validate();
    };

    validate() {
        for (let key in this.state.value) {
            if (this.state.value[key] === '') {
                this.setState({valid: false});
                return;
            }
        }
        if (!this.moduleIdList.includes(this.state.value['moduleId'])) {
            alert(`module id: ${this.state.value['moduleId']} does not exist!`)
            this.setState({valid: false});
            return;
        }
       this.setState({valid: true});
    }

    onUploadSuccessDialogDismiss() {
        this.setState({uploadSuccess: false});
    }

    onClickVisualEdit() {
        if (this.state.value.moduleId === '') {
            alert(`Module Id is empty!`);
            return;
        }

        let moduleDetailUri = `/api/v2/mp/modules/${this.state.value.moduleId}`;
        defaultRestServerClient.get(moduleDetailUri).then((response) => {
            [this.state.parameterValidatinDict.nameDict, this.state.parameterValidatinDict.defaultDict, this.state.parameterValidatinDict.enumDict, this.state.parameterValidatinDict.describeDict, this.state.parameterValidatinDict.dynaDict, this.state.parameterValidatinDict.inputTypeDict,
                this.state.parameterValidatinDict.fileNameDict, this.state.parameterValidatinDict.errorMsgDict, this.state.parameterValidatinDict.displayNameDict, this.state.parameterValidatinDict.paramDescDict, this.state.parameterValidatinDict.paramIsHiddenDict, 
                this.state.parameterValidatinDict.isRequiredDict, this.state.parameterValidatinDict.isValidDict] = parseInfo(response.data);
            this.setState({
                moduleData: response.data,
                showVisualEdit: true,
            });
        }).catch((err) => {
            alert(err.response.data.message);
        });
    }

    postExampleUpdate(data, exampleId) {        
        let exampleCreateUrl = `/api/v2/mp/examples/${exampleId}`;
        defaultRestServerClient.put(exampleCreateUrl, data).then((response) => {
            this.setState({
                createResultText: 'Update Example Success!',
                createSuccess: true,
                isUploading: false,
                showResultDialog: true,
            });
        }).catch((err) => {
            this.setState({
                createResultText: err.response.data.message,
                createSuccess: false,
                isUploading: false,
                showResultDialog: true,
            });
        });
    }

    postExampleCreate(data) {
        let exampleCreateUrl = `/api/v2/mp/examples`;
        defaultRestServerClient.post(exampleCreateUrl, data).then((response) => {
            this.setState({
                createResultText: 'Create Example Success!',
                createSuccess: true,
                isUploading: false,
                showResultDialog: true,
            });
        }).catch((err) => {
            this.setState({
                createResultText: err.response.data.message,
                createSuccess: false,
                isUploading: false,
                showResultDialog: true,
            });
        });
    }

    validateAllParameters() {
        try {
            let parameters = JSON.parse(this.state.value['parameters']);
            for(let key in this.state.parameterValidatinDict.nameDict) {
                let parameterName = this.state.parameterValidatinDict.nameDict[key];
                if (!parameters.hasOwnProperty(parameterName) && this.state.parameterValidatinDict.isRequiredDict[key]) {
                    alert(`Miss key: ${parameterName} in "Parameters" field!`);
                    return false;
                }
                this.validateParameterValue(key, parameters[parameterName]);
                if (!this.state.parameterValidatinDict.isValidDict[key]) {
                    alert(`Invalid key ${this.state.parameterValidatinDict.nameDict[key]} in "Parameters" field!`);
                    return false;
                }
            }
            for (let key in parameters) {
                if (!Object.values(this.state.parameterValidatinDict.nameDict).includes(key)) {
                    alert(`Invalid key ${key} in "Parameters" field!`);
                    return false;
                }
            }
        } catch {
            alert(`parameter is not valid JSON content!`);
            return false;
        }
        return true;
    }

    validateParameterValue(id, value) {
        let validationDict = this.state.parameterValidatinDict;
        let valueDict = validationDict.valueDict;
        valueDict[id] = value;
        let errorDict = validationDict.errorMsgDict;
        let validDict = validationDict.isValidDict;
        if (value === '' && validationDict.isRequiredDict[id]) {
            errorDict[id] = 'value could not be empty!'
            validDict[id] = false;
        }  else {
            if(validationDict.describeDict.hasOwnProperty(id)) {
                let rangeStrs = validationDict.describeDict[id].toString().match(/\[.*?\]/g);
                if(rangeStrs.length) {
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
    }
    
    render() {
        return( 
                <Stack >
                    <Stack gap={20} padding={20} horizontalAlign="center" styles={{root:{width:1000}}}>
                    <Stack className={styles.item}>
                        <Stack horizontal >
                            <DefaultButton onClick={this.clickSelectFile} text="Import from local"></DefaultButton>
                            <input ref={this.selectFile} type='file' style={{display: 'none'}} id={'abc'} onChange={this.onFileChange}></input>
                            <Label styles={{root:{paddingLeft: "10px"}}}>{this.state.displayFileName}</Label>
                        </Stack>
                        <Stack horizontal horizontalAlign="space-between" className={styles.stack}>
                            <Text variant="large">Name</Text>
                            <TextField onChange={this.onTextFieldChange} required className={styles.textField} id={'name'} value={this.state.value['name']}></TextField>
                        </Stack>
                        <Stack horizontal horizontalAlign="space-between" className={styles.stack}>
                            <Text variant="large">Category</Text>
                            <TextField onChange={this.onTextFieldChange} required className={styles.textField} id={'category'} value={this.state.value['category']}></TextField>
                        </Stack>
                        <Stack horizontal horizontalAlign="space-between" className={styles.stack}>
                            <Text variant="large">Group</Text>
                            <TextField onChange={this.onTextFieldChange} required className={styles.textField} id={'group'} value={this.state.value['group']}></TextField>
                        </Stack>
                        <Stack horizontal horizontalAlign="space-between" className={styles.stack}>
                            <Text variant="large">Description</Text>
                            <TextField onChange={this.onTextFieldChange} required multiline className={styles.textField} id={'description'} value={this.state.value['description']}></TextField>
                        </Stack>
                        <Stack horizontal horizontalAlign="space-between" className={styles.stack}>
                            <Text variant="large">Module</Text>
                            <Dropdown id={'moduleId'} className={styles.dropDown} onChange={this.onDropDownSelectionChange} selectedKey={this.state.value['moduleId']} options={this.moduleIdSelectOptions}></Dropdown>
                        </Stack>
                        <Stack horizontal horizontalAlign="space-between" className={styles.stack}>
                            <Text variant="large">Parameters</Text>
                            <Stack horizontal horizontalAlign="space-between" className={styles.textField}>
                                <TextField onChange={this.onTextFieldChange} styles={{root:{width:"80%"}}} required multiline id={'parameters'} value={this.state.value['parameters']}></TextField>
                                <DefaultButton styles={{root:{marginTop:"5%"}}} text="visual edit" onClick={this.onClickVisualEdit}></DefaultButton>
                            </Stack>
                        </Stack>
                    </Stack>
                </Stack>
                <Stack horizontal horizontalAlign="space-evenly" style={{marginBottom:"40px", marginTop:"30px"}}>
                    <StackItem>
                    <PrimaryButton disabled={!this.state.valid} text={this.props.ActionType} onClick={this.onClickCreate}/>
                    </StackItem>
                    <StackItem>
                        <DefaultButton onClick={()=>{this.setShowExampleManagement(false)}} text='Close' />
                    </StackItem>
                </Stack>
                {
                    this.state.showVisualEdit?
                    <VisualEdit
                    setState={this.setState}
                    state={this.state}
                    moduleData={this.state.moduleData}
                    parameters={this.state.value.parameters}
                    validate={this.validate}
                    validateParameterValue={this.validateParameterValue}
                    validateAllParameters={this.validateAllParameters}
                    />
                    :
                    null
                }
                {
                this.state.isUploading?
                  <Dialog 
                  isOpen={true} 
                  modalProps={{
                    isBlocking: true,
                    containerClassName: 'ms-dialogMainOverride'
                  }}
                  >
                    <Spinner size={SpinnerSize.large} label={this.props.ActionType === 'Update'?  'Updating example': 'Creating example'} ariaLive="assertive" />
                  </Dialog>
                  :
                  null
                }
                <Dialog isOpen={this.state.showConfirmDialog}
                        dialogContentProps={{
                        type: DialogType.normal,
                        title: 'Confirm',
                        subText: 'This operation will override existing configuration, do you want to continue?'
                        }}
                    >
                    <DialogFooter>
                        <PrimaryButton onClick={()=>{
                            this.setState({showConfirmDialog: false});
                            this.assignFileContent();
                            this.setState({displayFileName: this.state.fileName});
                        }} text="Yes" />
                        <DefaultButton onClick={()=>{
                            this.confirm = false;
                            this.setState({showConfirmDialog: false});
                        }} text="No"/>
                    </DialogFooter>
                </Dialog>
                <Dialog isOpen={this.state.showResultDialog}
                        onDismiss={()=>{this.setState({showResultDialog: false})}}
                        dialogContentProps={{
                            type: DialogType.normal,
                            title: this.state.createSuccess? 'Success!' : 'Failed!',
                            subText: this.state.createResultText
                            }}
                >
                    <DialogFooter>
                        <PrimaryButton text="OK" onClick={()=>{
                            this.setState({showResultDialog: false});
                            if (this.state.createSuccess) {
                                window.open(`${window.location.protocol}//${window.location.host}/marketplace.html`, '_self');
                            }
                        }}/>
                    </DialogFooter>
                </Dialog>
                </Stack>
        )
    };
}
