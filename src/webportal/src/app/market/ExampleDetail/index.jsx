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
import Context from '../ExampleList/Context'
import config from '../../config/webportal.config';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import ExampleDetailContent from './content';
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';
import {getTheme, ColorClassNames} from '@uifabric/styling';
const userAuth = require('../../user/user-auth/user-auth.component');
import JobSubmit from '../../mt-job-submission/mt-job-submission';
import ModuleDetail from '../../module/ModuleDetail';
import ExampleManagement from '../ExampleManagement'

export default class ExampleDetail extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isOpen: true,
            loading: false,
            showExampleDetail: false,
            showModuleSubmit: false,
            showModuleDetail: false,
            showExampleUpdate: false
        }
        this.moduleDict = props.moduleDict;
        this.moduleData = props.moduleData;
        this.exampleData = props.exampleData; 
        this.localSetState = this.setState.bind(this);
        this.setShowExampleDetail = props.setShowExampleDetail.bind(this);
        this.setShowModuleSubmit = this.setShowModuleSubmit.bind(this);
        this.setShowModuleDetail = this.setShowModuleDetail.bind(this);
        this.setShowExampleUpdate = this.setShowExampleUpdate.bind(this);
    }

    setShowExampleUpdate(value) {
        this.localSetState({showExampleUpdate: value});
    }

    setShowModuleSubmit(value) {
        this.localSetState({showModuleSubmit: value});
    }

    setShowModuleDetail(value) {
        this.localSetState({showModuleDetail: value});
    }

    render() {
        const {spacing} = getTheme();
        return (
            <Modal isOpen={true}>
            <Stack style={{ maxWidth:"1500px", maxHeight:"1200px"}}>
                <Stack style={{background:"#4A8EBE"}} itemsCenter="true">
                    <span style={{marginLeft:"70px", marginBottom:"8px", marginTop:"8px"}}><font size="5" color="white">{this.exampleData.info.name}</font></span>
                </Stack>
            </Stack>
            <Stack>
                <ExampleDetailContent 
                    exampleData={this.exampleData}
                    moduleData={this.moduleData}
                    setShowModuleDetail={this.setShowModuleDetail}
                    setShowExampleUpdate={this.setShowExampleUpdate}
                />
            </Stack>
            <Stack horizontal horizontalAlign="space-evenly" style={{marginBottom:"50px"}}>
                <StackItem>
                    <DefaultButton onClick={()=>{this.setShowExampleDetail(false)}} text='Close' />
                </StackItem>
            </Stack>
            {
                this.state.showModuleDetail? 
                <Stack>
                <ModuleDetail 
                    selectedModule={this.moduleData}
                    setShowModuleDetail={this.setShowModuleDetail}
                    exampleData={this.exampleData}
                />
                </Stack>
                : null
            }
            {
                this.state.showModuleSubmit? 
                <Stack>
                <JobSubmit 
                    moduleMetadata={this.moduleData}
                    setShowJobSubmitPage={this.setShowModuleSubmit}
                    exampleData={this.exampleData}
                />
                </Stack>
                : null
            }
            {
                this.state.showExampleUpdate?
                <Stack>
                    <ExampleManagement
                        setShowExampleManagement={this.setShowExampleUpdate}
                        moduleDict={this.moduleDict}
                        ActionType='Update'
                        ExampleId={this.exampleData.info.id}
                    />
                </Stack>
                :
                null
            }
        </Modal>
        );
    }
}
