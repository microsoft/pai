// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { combineReducers } from 'redux';
import { JobProtocol } from './job-protocol';
import { JobExtraInfo } from './job-extra-info';
import { SideInfo } from './side-info';

export default combineReducers({ JobProtocol, JobExtraInfo, SideInfo });
