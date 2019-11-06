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

import {
  FontClassNames,
  FontWeights,
  FontSizes,
  ColorClassNames,
  IconFontSizes,
  loadTheme,
} from '@uifabric/styling';
import c from 'classnames';
import copy from 'copy-to-clipboard';
import { get, isEmpty, isNil } from 'lodash';
import { DateTime } from 'luxon';
import {
  ActionButton,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  Link,
  MessageBar,
  MessageBarType,
  TooltipHost,
  DirectionalHint,
  IconButton,
  Stack,
  Dialog,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import yaml from 'js-yaml';

import t from '../../components/tachyons.scss';
import {isJobV2} from '../../job/job-view/fabric/job-detail/util';
import Card from './card';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

import EditMarketItem from './EditMarketItem';
import DeleteMarketItem from './DeleteMarketItem';
import MonacoPanel from '../../components/monaco-panel';

export default function Summary(props) {

  const [hideDialog, setHideDialog] = useState(true);
  const [hideDeleteDialog, setHideDeleteDialog] = useState(true);
  const [monacoProps, setMonacoProps] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  const {jobInfo, jobConfig} = props;

  const rawJobConfig = `protocolVersion: 2
  name: mintao_1572342386146
  type: job
  jobRetryCount: 0
  prerequisites:
    - type: dockerimage
      uri: openpai/tensorflow-py36-cu90
      name: docker_image_0
  taskRoles:
    taskrole:
      instances: 1
      completion:
        minFailedInstances: 1
        minSucceededInstances: 1
      taskRetryCount: 0
      dockerImage: docker_image_0
      resourcePerInstance:
        gpu: 1
        cpu: 4
        memoryMB: 8192
      commands:
        - git clone https://github.com/debuggy/marketplace-minist-example.git
        - cd marketplace-minist-example
        - python download.py
        - python softmax_regression.py
        - python convolutional.py
  defaults:
    virtualCluster: default`;

  function showDialog(event) {
    event.stopPropagation();
    setHideDialog(false);
  }

  function showDeleteDialog(event) {
    event.stopPropagation();
    setHideDeleteDialog(false);
  }

  function showEditor(title, props) {
    setModalTitle(title);
    setMonacoProps(props);
  }

  function onDismiss() {
    setModalTitle('');
    setMonacoProps(null);
  }

  function showJobConfig() {
    if (isJobV2(rawJobConfig)) {
      showEditor('Job Config', {
        language: 'yaml',
        value: yaml.safeDump(rawJobConfig),
      });
    } else {
      showEditor('Job Config', {
        language: 'json',
        value: JSON.stringify(rawJobConfig, null, 2),
      });
    }
  }

  return (
    <div className={t.mt3}>
      {/* summary */}
      <Card className={c(t.pv4, t.ph5)}>
        {/* summary-row-1 */}
        <div className={c(t.flex, t.justifyBetween, t.itemsCenter)}>
          <div
            className={c(t.flex, t.itemsCenter)}
            style={{ flexShrink: 1, minWidth: 0 }}
          >
            <div
              className={c(t.truncate)}
              style={{
                fontSize: FontSizes.xxLarge,
                fontWeight: FontWeights.regular,
              }}
            >
              {jobInfo.name}
            </div>
          </div>
        </div>
        {/* summary-row-2 */}
        <div className={c(t.mt4, t.flex, t.itemsStart)}>
          <div>
            <div className={c(t.gray, FontClassNames.medium)}>{jobInfo.author}</div>
          </div>
          <div className={c(t.bl, t.mh3)}></div>
          <div className={t.ml4}>
            <div className={c(t.gray, FontClassNames.medium)}>
              <Icon iconName='Like' />
                {jobInfo.submits}
            </div>
          </div>
          <div className={c(t.bl, t.mh3)}></div>
          <div className={t.ml4}>
            <div className={c(t.gray, FontClassNames.medium)}>
              <Icon iconName='Like' />
                {jobInfo.stars}
            </div>
          </div>
        </div>
        {/* summary-row-3 */}
        <div className={c(t.mt4, t.flex, t.justifyBetween, t.itemsCenter)}>
          <div>
            {jobInfo.introduction}
          </div>
        </div>
        {/* summary-row-4 */}
        <div className={c(t.mt4, t.flex, t.justifyBetween, t.itemsCenter)}>
          <div className={c(t.flex)}>
            <span>
              <PrimaryButton
                text='Clone'
              />
            </span>
            <span className={c(t.ml2)}>
              <PrimaryButton
                text='Edit'
                onClick={showDialog}
              />
            </span>
            <EditMarketItem
              hideDialog={hideDialog}
              setHideDialog={setHideDialog}
            />
            <span className={c(t.ml2)}>
              <PrimaryButton
                text='Delete'
                onClick={showDeleteDialog}
              />
            </span>
            <DeleteMarketItem
              hideDeleteDialog={hideDeleteDialog}
              setHideDeleteDialog={setHideDeleteDialog}
            />
          </div>
          <div>
            <span>
              <PrimaryButton
                text='Yaml File'
                onClick={showJobConfig}
              />
            </span>
          </div>
        </div>
        <MonacoPanel
          isOpen={!isNil(monacoProps)}
          onDismiss={onDismiss}
          title={modalTitle}
          monacoProps={monacoProps}
        />
      </Card>
    </div>
  );
}