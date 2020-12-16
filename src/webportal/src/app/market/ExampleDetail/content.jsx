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

import React from 'react';
import { Stack, TextField, PrimaryButton, DefaultButton, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { Separator } from 'office-ui-fabric-react/lib/Separator';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { defaultRestServerClient } from '../../common/http-client';
const htmlParse = require('html-react-parser');
import { extractUriFromStr } from '../util/tool'

export default class ExampleDetailContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showConfirmDialog: false,
            showResultDialog: false,
            isDeleting: false,
            deleteSuccess: false,
            deleteResultText: ''
        }
        this.exampleData = props.exampleData;
        this.moduleData = props.moduleData;
        this.setShowModuleDetail = props.setShowModuleDetail.bind(this);
        this.deleteExample = this.deleteExample.bind(this);
        this.onClickDownloadExample = this.onClickDownloadExample.bind(this);
        this.setShowExampleUpdate = props.setShowExampleUpdate.bind(this);
    }

    onClickDownloadExample() {
        let exampleDetailUri = `/api/v2/mp/examples/${this.exampleData.info.id}`;
        defaultRestServerClient.get(exampleDetailUri).then((response) => {
            let text = new Blob([response.data], {type: 'text/plain'});
            const url = window.URL.createObjectURL(text);
            const element = document.createElement('a');
            element.style.display = 'none';
            element.href = url;
            // the filename you want
            element.download = this.exampleData.info.id;
            document.body.appendChild(element);
            element.click();
            window.URL.revokeObjectURL(url);
        }).catch((err) => {
            alert(err.response.data.message);
        });
    }

    deleteExample() {
        this.setState({
            showConfirmDialog: false,
            isDeleting: true,
        });
        let exampleDeleteUrl = `/api/v2/mp/examples/${this.exampleData.info.id}`;
        defaultRestServerClient.delete(exampleDeleteUrl).then((response) => {
            this.setState({
                deleteResultText: 'Delete example success!',
                deleteSuccess: true,
                isDeleting: false,
                showResultDialog: true,
            });
        }).catch((err) => {
            this.setState({
                deleteResultText: err.response.data.message,
                deleteSuccess: false,
                isDeleting: false,
                showResultDialog: true,
            });
        });
    }

    render() {
        let uriList = new Set(extractUriFromStr(this.exampleData.info.description));
        let describeValue = this.exampleData.info.description;
        if (uriList) {
          uriList.forEach(element => {
            describeValue = describeValue.replace(element, `<a style={{overflowWrap: "break-word", width:300}} target="_blank" href="${element}">source code</a>`);
          });
        }
        describeValue = `<div style={{overflowWrap: "break-word"}}>${describeValue}<div>`;

        return (
            <div styles={{width:600}} >
            <Stack styles={{root:{ marginLeft:100, marginRight:100, marginTop:50, marginBottom:50, width: 600}}}  tokens={{childrenGap: 5, padding: 20}}>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Id</Text>
                    <TextField multiline underlined readOnly value={this.exampleData.info.id} styles={{root:{width:450}}}></TextField>
                </Stack>
                <Separator></Separator>
                <Stack horizontal horizontalAlign="space-between" >
                    <Text>Name</Text>
                    <Text styles={{root:{width:450}}}>{this.exampleData.info.name}</Text>
                </Stack>
                <Separator></Separator>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Category</Text>
                    <Text styles={{root:{width:450}}}>{this.exampleData.info.category}</Text>
                </Stack>
                <Separator></Separator>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Owner</Text>
                    <Text styles={{root:{width:450}}}>{this.exampleData.info.owner}</Text>
                </Stack>
                <Separator></Separator>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Group</Text>
                    <Text styles={{root:{width:450}}}>{this.exampleData.info.group}</Text>
                </Stack>
                <Separator></Separator>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>ModuleName</Text>
                    <ActionButton styles={{root:{width:450}}}>
                        <Text variant="large" onClick={()=>{this.setShowModuleDetail(true)}}>
                            <font color="4A8EBE">{this.moduleData.name}</font>
                        </Text>
                    </ActionButton>
                </Stack>
                <Separator></Separator>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Description</Text>
                    <Stack styles={{root:{maxWidth:450, width: 450}}}>
                        <div style={{overflowWrap: "break-word"}}>
                            {htmlParse(describeValue)}
                        </div>
                        
                    </Stack>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                    <ActionButton
                    onClick={()=>{this.setShowExampleUpdate(true)}}
                    >
                        <Text variant="large"><font color="4A8EBE">Update this example</font></Text>
                    </ActionButton>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                    <ActionButton>
                        <Text onClick={() => {this.setState({showConfirmDialog: true})}} variant="large"><font color="4A8EBE">Delete this example</font></Text>
                    </ActionButton>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                    <ActionButton>
                        <Text onClick={this.onClickDownloadExample} variant="large"><font color="4A8EBE">Download this example</font></Text>
                    </ActionButton>
                </Stack>
                <Dialog 
                isOpen={this.state.isDeleting} 
                modalProps={{
                isBlocking: true,
                containerClassName: 'ms-dialogMainOverride'
                }}
                >
                <Spinner size={SpinnerSize.large} label={'Deleting example...'} ariaLive="assertive" />
                </Dialog>
                <Dialog isOpen={this.state.showConfirmDialog}
                        dialogContentProps={{
                        type: DialogType.normal,
                        title: 'Confirm',
                        subText: `Do you want to delete example ${this.exampleData.info.id}?`
                        }}
                    >
                    <DialogFooter>
                        <PrimaryButton onClick={this.deleteExample}
                        text="Yes" />
                        <DefaultButton onClick={()=>{
                            this.setState({showConfirmDialog: false});
                        }} text="No"/>
                    </DialogFooter>
                </Dialog>
                <Dialog isOpen={this.state.showResultDialog}
                        modalProps={{
                            isBlocking: true,
                            containerClassName: 'ms-dialogMainOverride'
                            }}
                        dialogContentProps={{
                        type: DialogType.normal,
                        title: this.state.deleteSuccess? 'Success!' : 'Failed!',
                        subText: this.state.deleteResultText
                        }}
                    >
                    <DialogFooter>
                        <PrimaryButton text="OK" onClick={()=>{
                            this.setState({showResultDialog: false});
                            if (this.state.deleteSuccess) {
                                window.open(`${window.location.protocol}//${window.location.host}/marketplace.html`, '_self');
                            }
                        }}/>
                    </DialogFooter>
                </Dialog>
            </Stack>
            </div>
        )
    }
}