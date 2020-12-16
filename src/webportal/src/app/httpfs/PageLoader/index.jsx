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

import * as querystring from 'querystring';

import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {debounce, isEmpty, isNil} from 'lodash';

import {ColorClassNames, getTheme} from '@uifabric/styling';
import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {Overlay} from 'office-ui-fabric-react/lib/Overlay';
import {Stack} from 'office-ui-fabric-react/lib/Stack';
import TopBar from './TopBar';
import {SpinnerLoading} from '../../components/loading';
import c from 'classnames';
import t from '../../components/tachyons.scss';
import {FontClassNames, Icon, FontSizes, FontWeights} from 'office-ui-fabric-react';

import {getSubclusterConfigByName, getSelectedSubclusterConfig} from '../../common/subcluster';
import {checkToken} from '../../user/user-auth/user-auth.component';

initializeIcons();

function Msginfo(props) {
  if(props.message == null || props.message == '' || props.message == undefined){
    return null
  }
  else{
    return (
      <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
        <div className={c(t.tc)}>
          <div>
            <Icon className={c(ColorClassNames.themePrimary)} style={{fontSize: FontSizes.xxLarge}} iconName='Error' />
          </div>
          <div className={c(t.mt5, FontClassNames.xLarge)} style={{fontWeight: FontWeights.semibold}}>
            {props.message}
          </div>
        </div>
      </div>
    );
  }
}

function Iframe(props) {
  const [initLoading, setInitLoading] = useState(true);
  return (
    <React.Fragment>
      {initLoading && <SpinnerLoading />}
      <div style={{width:'100%', height:'100%', overflow:'hidden'}}>
      <iframe
        style={{width:'100%', height:"100%", overflow:'visible', position:'relative', top:'0px'}}
        onLoad={() => setInitLoading(false)}
        title={props.url}
        src={props.url}
        frameBorder="0"
        scrolling="auto"
      />
      </div>
    </React.Fragment>
  );
}

//httpfs iframe src format
//https://proxy1-ivip.yarn3-dev-bn1.bn1.ap.gbl:83/httpfs/explorer.html?mt-token=xxxxxx#/

export default function PageLoader() {
  const {spacing} = getTheme();
  let subclusterConfig = getSelectedSubclusterConfig();
  let url = '';
  let message = null;

  if(subclusterConfig != null && subclusterConfig.HttpFSUri != null && subclusterConfig.HttpFSUri != undefined)
  {
    let baseUrl = subclusterConfig.HttpFSUri;
    let token = checkToken(true);
    url = `${baseUrl}/httpfs/explorer.html?mt-token=${token}#/`;
  }
  if(!url.startsWith('https'))
  {
    message = 'Current Cluster\' Files page not avaliable.';
  }

  return (
      <Fabric style={{height: '100%'}}>
        <Stack
          verticalFill
          styles={{root: {position: 'relative', padding: `${spacing.s1} ${spacing.l1} ${spacing.l1}`}}}
        >
          <Stack.Item>
            <TopBar/>
          </Stack.Item>
          <Stack.Item>
            <div style={{height: spacing.s1}}></div>
          </Stack.Item>
          <Stack.Item grow styles={{root: {height: 0, backgroundColor: 'white', padding: spacing.l1}}}>
            {message == null && <Iframe url={url}/>}
            <Msginfo message={message}/>
          </Stack.Item>
        </Stack>
      </Fabric>
  );
}
