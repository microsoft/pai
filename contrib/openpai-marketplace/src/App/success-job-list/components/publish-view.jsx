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
import uuid4 from 'uuid/v4';
import React, { useState, useCallback, useContext } from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Dialog,
  DialogFooter,
  Dropdown,
  DialogType,
  TextField,
  Stack,
  FontSizes,
  FontWeights,
  Text,
} from 'office-ui-fabric-react';
import { getTheme } from '@uifabric/styling';
import { isNil } from 'lodash';
import yaml from 'js-yaml';

import { TagBar } from '../../components/tag-bar';
import PreviewYamlFile from '../components/preview-yamlFile';
import Context from '../Context';

const PublishView = () => {
  const { spacing } = getTheme();

  const {
    currentJob,
    currentJobConfig,
    setOpenJobDetail,
    name,
    setName,
    category,
    setCategory,
    tags,
    setTags,
    introduction,
    setIntroduction,
    description,
    setDescription,
  } = useContext(Context);

  const CATEGORY_OPTIONS = [
    { key: 'custom', text: 'custom' },
    { key: 'official', text: 'official' },
  ];

  return (
    <Stack gap='m'>
      <TextField
        label='Name'
        value={name}
        onChange={e => {
          setName(e.target.value);
        }}
        required
      />
      <Dropdown
        label='Category'
        options={CATEGORY_OPTIONS}
        defaultSelectedKey={'custom'}
        onChange={(e, item) => setCategory(item.text)}
        required
      />
      <Stack gap='s1'>
        <span>Tags</span>
        <TagBar tags={tags} setTags={setTags} />
      </Stack>
      <TextField
        label='Introduction'
        value={introduction}
        onChange={e => {
          setIntroduction(e.target.value);
        }}
        required
      />
      <TextField label='Author' value={cookies.get('user')} disabled />
      <TextField
        label='Description'
        value={description}
        multiline
        rows={20}
        onChange={e => {
          setDescription(e.target.value);
        }}
        required
      />
      <PreviewYamlFile />
    </Stack>
  );
};

export default PublishView;
