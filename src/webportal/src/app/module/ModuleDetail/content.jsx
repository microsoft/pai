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
import { Stack, StackItem, TextField } from 'office-ui-fabric-react';
import { Modal } from 'office-ui-fabric-react/lib/Modal'
import Context from '../ModuleList/Context'
import config from '../../config/webportal.config';
const userAuth = require('../../user/user-auth/user-auth.component');
import { Text } from 'office-ui-fabric-react/lib/Text';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';

export default class ModuleDetailContent extends React.Component {
    constructor(props) {
        super(props);
        this.selectedModule = props.selectedModule;
        this.moduleDetail = props.moduleDetail;
        this.interface = this.moduleDetail.match(/i=".*?"/);
    }

    render() {
        return (
            <Stack styles={{root:{ marginLeft:100, marginRight:100, marginTop:50, marginBottom:50, width: 600}}}  tokens={{childrenGap: 40, padding: 20}}>
                <Stack horizontal horizontalAlign="space-between" value={this.selectedModule.id}>
                    <Text>Id</Text>
                    <TextField underlined readOnly styles={{root:{width:450}}} value={this.selectedModule.id}></TextField>
                </Stack>
                <Stack horizontal horizontalAlign="space-between" >
                    <Text>Name</Text>
                    <TextField underlined readOnly styles={{root:{width:450}}} value={this.selectedModule.name}></TextField>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                    <span>Description</span>
                    <TextField underlined readOnly styles={{root:{width:450}}} multiline value={this.selectedModule.description}></TextField>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Version</Text>
                    <TextField underlined readOnly styles={{root:{width:450}}} value={this.selectedModule.version}></TextField>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Owner</Text>
                    <TextField underlined readOnly styles={{root:{width:450}}} value={this.selectedModule.owner}></TextField>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                    <Text>Interface</Text>
                    <TextField underlined readOnly styles={{root:{width:450}}} multiline value={this.interface}></TextField>
                </Stack>
            </Stack>
        )
    }
}