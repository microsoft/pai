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
import PropTypes from 'prop-types';
import React, { useState, useContext, useEffect, useCallback } from 'react';
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
  getTheme,
  Icon,
} from 'office-ui-fabric-react';
import { FontClassNames } from '@uifabric/styling';
import { isNil } from 'lodash';

import Context from '../Context';
import { updateMarketItem } from '../utils/conn';
import { TagBar } from '../../components/tag-bar';

const { spacing, palette } = getTheme();

export default function EditMarketItem(props) {
  const { hideDialog, setHideDialog } = props;
  const { marketItem } = useContext(Context);

  const [name, setName] = useState(marketItem.name);
  const [category, setCategory] = useState(marketItem.category);
  const [tags, setTags] = useState(marketItem.tags);
  const [introduction, setIntroduction] = useState(marketItem.introduction);
  const [description, setDescription] = useState(marketItem.description);

  const CATEGORY_OPTIONS = [
    { key: 'custom', text: 'custom' },
    { key: 'official', text: 'official' },
  ];

  const checkRequired = () => {
    if (name === '') {
      alert('Title required');
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
    return true;
  };

  async function onConfirm() {
    // check required
    if (!checkRequired()) {
      return;
    }
    setHideDialog(true);

    // connect to rest-server confirm edit
    await updateMarketItem(
      name,
      marketItem.author,
      category,
      introduction,
      description,
      marketItem.jobConfig,
      marketItem.submits,
      marketItem.stars,
      tags,
    );
    // refresh market-detail.html
    window.location.href = `/market-detail.html?itemId=${marketItem.id}`;
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
            Edit MarketItem
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
          defaultSelectedKey={category}
          onChange={(e, item) => {
            setCategory(item.text);
          }}
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
        <TextField label='Author' value={marketItem.author} disabled />
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
      </Stack>
      <DialogFooter>
        <PrimaryButton onClick={onConfirm} text='Confirm' />
        <DefaultButton onClick={closeDialog} text='Cancel' />
      </DialogFooter>
    </Dialog>
  );
}

EditMarketItem.propTypes = {
  hideDialog: PropTypes.bool.isRequired,
  setHideDialog: PropTypes.func.isRequired,
};
