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
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';
import {getTheme, ColorClassNames} from '@uifabric/styling';
const userAuth = require('../../user/user-auth/user-auth.component');
import Form from './Components/Form';
import {initTheme} from '../../components/theme';

initTheme()

export default class ExampleManagement extends React.Component {

    constructor(props) {
        super(props);
        this.moduleData = props.moduleData;
        console.log(props.moduleData)
        this.exampleData = props.exampleData;
        this.moduleDict = props.moduleDict;
        this.ActionType = props.ActionType;
        this.localSetState = this.setState.bind(this);
        this.ExampleId = props.ExampleId;
        this.setShowExampleManagement = props.setShowExampleManagement.bind(this);
        this.setState = this.setState.bind(this);
    }

    render() {
        const {spacing} = getTheme();
        return (
        <Modal isOpen={true}>
        <Stack style={{ maxWidth:"1500px", maxHeight:"1200px"}}>
            <Stack style={{background:"#4A8EBE"}} itemsCenter="true">
                <span style={{marginLeft:"70px", marginBottom:"8px", marginTop:"8px"}}><font size="5" color="white">{this.ActionType === 'Update'? 'Update example':'Create example'}</font></span>
            </Stack>
            </Stack>
            <Stack>
            <Stack>
                <Form 
                ActionType={this.ActionType}
                setShowExampleManagement={this.setShowExampleManagement}
                moduleIdList={Object.keys(this.moduleDict)}
                moduleDict={this.moduleDict}
                ExampleId={this.ExampleId}
                />
            </Stack>
        </Stack>
        </Modal>
        );
    }
}
