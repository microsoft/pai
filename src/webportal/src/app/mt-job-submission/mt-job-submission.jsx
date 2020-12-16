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
import { Stack, StackItem } from 'office-ui-fabric-react';
import { Modal } from 'office-ui-fabric-react/lib/Modal'
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import JobSubmitContent from './components/content'
import parseInfo from './utils/parseModuleInfo'
import subclustersConfig from '../config/subclusters.config';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { getHDFSClient } from './utils/hdfs';
import { defaultRestServerClient, getClientsForSubcluster } from '../common/http-client';
import { getSubclusterConfigByName } from '../common/subcluster';

const defaultCluster = 'BN2-0';

export default class JobSubmit extends React.Component {

    constructor(props) {
        super(props);
        this.userAlias = 'hadoop';
        this.moduleMetadata = props.moduleMetadata;
        this.setShowJobSubmitPage = props.setShowJobSubmitPage.bind(this);
        this.loadModuleData = this.loadModuleData.bind(this);
        this.submitJob = this.submitJob.bind(this);
        this.closeResultDialog = this.closeResultDialog.bind(this);
        this.exampleData = props.exampleData;
        this.fileUpload = this.fileUpload.bind(this);
        this.initUser = this.initUser.bind(this);
        this.sendSubmitRequest = this.sendSubmitRequest.bind(this);

        this.state = {
            isOpen: false, nameDict: {}, defaultDict: {}, enumDict: {}, describeDict: {}, dynaDict: {}, inputTypeDict: {},
            fileNameDict: {}, fileDict: {}, errorMsgDict: {}, displayNameDict: {}, paramDescDict: {}, paramIsHiddenDict: {},
            isRequiredDict: {}, isValidDict: {}, valueDict: {}, validationPass: true, cluster: null, resultDialogVisible: false,
            isUploadingFile: false, uploadingFileName: ''
        };
        this.setState = this.setState.bind(this);
        this.runCommand = null;
        this.detailURL = null;
        this.submitSuccess = false;
        this.testValue = null;

        this.initUser();
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

    componentDidMount() {
        this.loadModuleData();
    }

    setValidation() {
        this.setState({validationPass: false});
    }

    loadModuleData() {
        let moduleDetailUri = `/api/v2/mp/modules/${this.moduleMetadata.id}`;
        defaultRestServerClient.get(moduleDetailUri).then((response) => {
            let data = response.data;
            let [nameDict, defaultDict, enumDict, describeDict, dynaDict, inputTypeDict, fileNameDict, errorMsgDict, displayNameDict, 
                paramDescDict, paramIsHiddenDict, isRequiredDict, isValidDict, runStr, clusterParaStr] = parseInfo(data);

            [this.state.nameDict, this.state.defaultDict, this.state.enumDict, this.state.describeDict, this.state.dynaDict,
             this.state.inputTypeDict, this.state.fileNameDict, this.state.errorMsgDict, this.state.displayNameDict, 
             this.state.paramDescDict, this.state.paramIsHiddenDict, this.state.isRequiredDict, this.state.isValidDict,
             this.runCommand, this.state.clusterKeyName] = [nameDict, defaultDict, enumDict, describeDict, dynaDict, inputTypeDict, fileNameDict, errorMsgDict, displayNameDict, 
                paramDescDict, paramIsHiddenDict, isRequiredDict, isValidDict, runStr, clusterParaStr];
            let valueDict = {};
            for (let key in this.state.nameDict) {
                valueDict[key] = this.state.defaultDict.hasOwnProperty(key) ? this.state.defaultDict[key] : ''
                if (this.state.nameDict[key] === this.state.clusterKeyName) {
                    let cachedCluster = cookies.get("subClusterUri");
                    if (cachedCluster !== undefined && cachedCluster.length > 0 ) {
                        const clusters = subclustersConfig.Clusters.Cluster;
                        const clusterIndex = this.state.nameDict[key] !== undefined ?
                        (clusters.findIndex((x) => x.subCluster.toLowerCase() === cachedCluster.toLowerCase())) : -1;
                        valueDict[key] = clusterIndex !== -1? clusters[clusterIndex].Name: '';
                    } else {
                        valueDict[key] = '';
                    }
                }
                if (this.exampleData && this.exampleData.parameters.hasOwnProperty(this.state.nameDict[key])) {
                    valueDict[key] = this.exampleData.parameters[this.state.nameDict[key]].toString();
                }
            }
            this.setState({
                valueDict: valueDict,
                isOpen: true,
            });
        }).catch((err) => {
            if (err.response) {
                alert(err.response.data.message);
            } else {
                alert(err.message);
            }
        });
    }

    closeResultDialog() {
        this.setState({ resultDialogVisible: false });
        this.setShowJobSubmitPage(false);
    }

    async fileUpload(moduleId, moduleParams, subclusterName) {
        let subclusterConfig = getSubclusterConfigByName(subclusterName);
        if (subclusterConfig === null) {
            throw new Error(`Invalid subcluster ${subclusterName}`);
        }
        // inputTypeDict: {0: Key0, 1: Key1}...
        let indicies = Object.keys(this.state.inputTypeDict).filter((index) => this.state.inputTypeDict[index] === 'local path' && this.state.fileDict.hasOwnProperty(index)); // filter out local path inputs
        this.setState({isUploadingFile: true});
        try {
            for (let index of indicies) {
                let file = this.state.fileDict[index]; // This is a File object
                let fileDir = `/user/${this.userAlias}/MP/cache`;
                let hdfsClient = getHDFSClient(this.userAlias, subclusterName);
                // First try to make dir
                await hdfsClient.mkdir(fileDir, '777');
                const filePath = `${fileDir}/${file.name}`;
                moduleParams[this.state.nameDict[index]] = `${subclusterConfig.hdfsUri}${filePath}`;
                this.setState({uploadingFileName: file.name});
                // Then try to upload file
                await hdfsClient.uploadFile(filePath, file, '644', true);
            }
        } finally {
            // end
            this.setState({isUploadingFile: false});
        }
    }

    async sendSubmitRequest(moduleId, moduleParams, subclusterName) {
        let subclusterConfig = getSubclusterConfigByName(subclusterName);
        let data = {
            moduleId: moduleId,
            parameters: moduleParams
        };
        if (this.state.valueDict.frameworkId) { // This could be undefined or empty string
            data.frameworkName = this.state.valueDict.frameworkId;
        }
        let client = getClientsForSubcluster(subclusterName).restServerClient;
        try {
            let response = await client.post('/api/v2/mp/jobs', data);
            this.submitSuccess = true;
            this.result = 'Submission success!Go to detail page:';
            let jobName = response.data.frameworkName;
            let groupId = response.data.groupId;
            const params = new URLSearchParams({
                subCluster: subclusterConfig.subCluster,
                jobName: jobName,
                groupId: groupId,
            });
            this.detailURL = `${window.location.protocol}//${window.location.host}/job-detail.html?${params.toString()}`;
            this.setState({ resultDialogVisible: true, isOpen: false });
        } catch (err) {
            if (err.response) {
                alert(`Submit job error.\nError message: ${err.response.data.message}`);
            } else {
                alert(`Submit job error.\nError message: ${err.message}`);
            }
            this.trackingURL = '';
            this.setState({ resultDialogVisible: false });
        };
    }

    async submitJob(event) {
        let moduleParams = {};
        for (let key in this.state.nameDict) {
            if (this.state.valueDict.hasOwnProperty(key)) {
                moduleParams[this.state.nameDict[key]] = this.state.valueDict[key].replace(/%/g, '%%');
            }
        }
        // this.state.clusterKeyName is "subCluster"...
        let subclusterName = moduleParams[this.state.clusterKeyName] || defaultCluster;
        moduleParams['Owner'] = this.moduleMetadata.owner;
        moduleParams['run'] = this.runCommand;
        let moduleId = this.moduleMetadata.id;
        await this.fileUpload(moduleId, moduleParams, subclusterName);
        await this.sendSubmitRequest(moduleId, moduleParams, subclusterName);
    }

    render() {
        return (
            <div>
            <Modal isOpen={this.state.isOpen}>
                <Stack style={{ maxWidth:"1500px", maxHeight:"1200px"}}>
                    <Stack horizontal style={{background:"#4A8EBE"}} itemsCenter="true">
                        <span style={{marginLeft:"70px", marginBottom:"8px", marginTop:"8px"}}><font size="5" color="white">{this.moduleMetadata.name}</font></span>
                        {
                            this.moduleMetadata.status === 'deprecate'? 
                            <span style={{marginLeft:"10px", marginBottom:"8px", marginTop:"8px"}}><font size="5" color="red">{'(deprecated)'}</font></span>
                            :
                            null
                        }
                    </Stack>
                </Stack>
                <JobSubmitContent 
                    state={this.state}
                    setState={this.setState}
                />
                <Stack horizontal horizontalAlign="space-evenly" style={{marginBottom:"50px"}}>
                    <StackItem>
                        <PrimaryButton onClick={this.submitJob} id='submit' text='Submit' disabled={!this.state.validationPass}/>
                    </StackItem>
                    <StackItem>
                        <DefaultButton onClick={()=>{this.setShowJobSubmitPage(false); this.setState({isOpen: false})}} text='Close' />
                    </StackItem>
                </Stack>
            </Modal>
            <Dialog isOpen={this.state.resultDialogVisible}
                    onDismiss={this.closeResultDialog}
                    dialogContentProps={{
                    type: DialogType.normal,
                    title: this.submitSuccess? 'Submit Completed!': 'Submit Failed!',
                    subText:
                            this.submitSuccess? 'Click the \'Detail\' button go to job detail page!\n' + 
                            'It may take 4-5 minutes to get the result!' :
                        'Error'
                    }}
                >
                <DialogFooter>
                { this.submitSuccess && 
                    <PrimaryButton onClick={()=>{
                    window.open(this.detailURL);
                    this.closeResultDialog();
                    }} text="Detail" />
                }
                </DialogFooter>
            </Dialog>
            {
                this.state.isUploadingFile?
                <Dialog 
                isOpen={true} 
                modalProps={{
                    isBlocking: true,
                    containerClassName: 'ms-dialogMainOverride'
                }}
                >
                  <Spinner size={SpinnerSize.large} label={`Uploading file: ${this.state.uploadingFileName}`} ariaLive="assertive" />
                </Dialog>
                :
                null
            }
            </div>
        )
    }
}