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
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';
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

import { createMarketItem } from '../utils/conn';
import { MarketItem } from '../../models/market-item';
import { TagBar } from '../../components/tag-bar';
import ImportYamlFile from './import-yaml-file';

export default function CreateMarketItem(props) {
  const { spacing } = getTheme();

  const { hideDialog, setHideDialog } = props;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [tags, setTags] = useState([]);
  const [introduction, setIntroduction] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [yamlText, setYamlText] = useState();

  const CATEGORY_OPTIONS = [
    { key: 'custom', text: 'custom' },
    { key: 'official', text: 'official' },
  ];

  const checkRequired = () => {
    if (name === '') {
      alert('Title required');
      return false;
    }
    if (author === '') {
      alert('author required');
      return false;
    }
    if (introduction === '') {
      alert('introduction required');
      return false;
    }
    if (description === '') {
      alert('description required');
      return false;
    }
    if (isNil(yamlText)) {
      alert('yaml file required');
      return false;
    }
    return true;
  };

  async function onConfirm() {
    // check required
    if (!checkRequired()) {
      return;
    }
    setHideDialog(true);

    // post a marketitem
    const marketItem = new MarketItem(
      uuid4(),
      name,
      author,
      new Date(),
      new Date(),
      category,
      tags,
      introduction,
      description,
      yamlText,
      0,
      0,
    );
    const itemId = await createMarketItem(marketItem);
    // refresh market-detail.html
    window.location.href = `/market-detail.html?itemId=${itemId}`;
  }

  const closeDialog = useCallback(() => {
    setHideDialog(true);
  });

  return (
    <Dialog
      hidden={hideDialog}
      onDismiss={closeDialog}
      minWidth={800}
      dialogContentProps={{
        type: DialogType.normal,
        showCloseButton: false,
        title: (
          <Text
            styles={{
              root: {
                fontSize: FontSizes.large,
                fontWeight: FontWeights.semibold,
                paddingBottom: spacing.m,
              },
            }}
          >
            Create Market Item
          </Text>
        ),
      }}
      modalProps={{
        isBlocking: true,
      }}
    >
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
        <TextField
          label='Author'
          value={author}
          onChange={e => {
            setAuthor(e.target.value);
          }}
          required
        />
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
        <ImportYamlFile setYamlText={setYamlText} />
      </Stack>
      <DialogFooter>
        <PrimaryButton onClick={onConfirm} text='Confirm' />
        <DefaultButton onClick={closeDialog} text='Cancel' />
      </DialogFooter>
    </Dialog>
  );
}

CreateMarketItem.propTypes = {
  hideDialog: PropTypes.bool.isRequired,
  setHideDialog: PropTypes.func.isRequired,
};
