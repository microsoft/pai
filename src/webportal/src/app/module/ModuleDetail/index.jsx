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
import Context from '../ModuleList/Context'
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import ModuleDetailContent from './content'
import JobSubmit from '../../mt-job-submission/mt-job-submission';
import {defaultRestServerClient} from '../../common/http-client';


export default class ModuleDetail extends React.Component {

    constructor(props) {
        super(props);
        this.selectedModule = props.selectedModule;
        this.exampleData = props.exampleData;
        this.moduleDetail = null;
        this.loadData = this.loadData.bind(this);
        this.setShowModuleDetail = props.setShowModuleDetail.bind(this);
        this.setShowModuleSubmit = this.setShowModuleSubmit.bind(this);
        this.state = {
            isOpen: false,
            showModuleSubmit: false
        }
        this.setState = this.setState.bind(this);
    }

    componentDidMount() {
        void this.loadData();
    }

    setShowModuleSubmit(value) {
        this.setState({showModuleSubmit: value});
    }

    loadData() {
        let moduleDetailUri = `/api/v2/mp/modules/${this.selectedModule.id}`;
        defaultRestServerClient.get(moduleDetailUri).then((response) => {
            this.moduleDetail = response.data.info;
            this.setState({isOpen: true});
        }).catch((err) => {
            if (err.response) {
                alert(err.response.data.message);
            } else {
                alert(err.message);
            }
        });
    }

    render() {
        return (
            <Modal isOpen={this.state.isOpen}>
                <Stack style={{ maxWidth:"1500px", maxHeight:"1200px"}}>
                    <Stack style={{background:"#4A8EBE"}} itemsCenter="true">
                        <span style={{marginLeft:"70px", marginBottom:"8px", marginTop:"8px"}}><font size="5" color="white">{this.selectedModule.name}</font></span>
                    </Stack>
                </Stack> 
                <ModuleDetailContent 
                    selectedModule={this.selectedModule}
                    moduleDetail={this.moduleDetail}
                />
                <Stack horizontal horizontalAlign="space-evenly" style={{marginBottom:"50px"}}>
                    <StackItem>
                        <DefaultButton onClick={()=>{this.setShowModuleDetail(false); this.setState({isOpen: false})}} text='Close' />
                    </StackItem>
                </Stack>
            </Modal>
        )
    }
}