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
import React, { useState, useContext, useEffect } from 'react';
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

import Context from './Context';
import { updateMarketItem } from './conn';

const { spacing, palette } = getTheme();

export default function EditMarketItem(props) {
  const { hideDialog, setHideDialog } = props;
  const { marketItem } = useContext(Context);

  const [name, setName] = useState(marketItem.name);
  const [category, setCategory] = useState(marketItem.category);
  const [tags, setTags] = useState([]);
  const [introduction, setIntroduction] = useState(marketItem.introduction);
  const [author, setAuthor] = useState(marketItem.author);
  const [description, setDescription] = useState(marketItem.description);
  const [tagEdit, setTagEdit] = useState('');

  const CATEGORY_OPTIONS = [
    { key: 'custom', text: 'custom' },
    { key: 'official', text: 'official' },
  ];

  useEffect(() => {
    if (marketItem.tags !== null) {
      setTags(marketItem.tags.split('|'));
    }
  }, []);

  async function onConfirm() {
    setHideDialog(true);
    // parse tags to store in sqlite
    var tagList = '';
    tags.forEach(function(tag) {
      tagList = tagList + tag + '|';
    });
    tagList = tagList.substr(0, tagList.length - 1);
    // connect to rest-server confirm edit
    await updateMarketItem(
      marketItem.id,
      name,
      marketItem.author,
      marketItem.createDate,
      new Date().toString(),
      category,
      tagList,
      introduction,
      description,
      marketItem.jobConfig,
      marketItem.submits,
      marketItem.stars,
    );
    // refresh market-detail.html
    window.location.href = `/market-detail.html?itemId=${marketItem.id}`;
  }

  function closeDialog() {
    setHideDialog(true);
  }

  function handleChangeName(e) {
    setName(e.target.value);
  }

  function handleChangeCategory(e, item) {
    setCategory(item.text);
  }

  function handleChangeTags(e) {
    setTagEdit(e.target.value);
  }

  function handleChangeIntroduction(e) {
    setIntroduction(e.target.value);
  }

  function handleChangeDescription(e) {
    setDescription(e.target.value);
  }

  function onAddTagCliked(e) {
    // check empty
    if (tagEdit === '') {
      return;
    }
    // check tag duplicates
    if (tags.includes(tagEdit)) {
      alert('duplicated tags');
      setTagEdit('');
      return;
    }
    setTags([...tags, tagEdit]);
    setTagEdit('');
  }

  function onDeleteTagCliked(tagToDelete) {
    setTags(tags.filter(tag => tag !== tagToDelete));
  }

  return (
    <Dialog
      hidden={hideDialog}
      onDismiss={closeDialog}
      minWidth={600}
      maxWidth={700}
      dialogContentProps={{
        type: DialogType.normal,
        showCloseButton: false,
        styles: {
          title: { paddingBottom: '12px' },
        },
        title: (
          <Text
            styles={{
              root: {
                fontSize: FontSizes.large,
                fontWeight: FontWeights.semibold,
              },
            }}
          >
            Edit MarketItem
          </Text>
        ),
      }}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 450 } },
      }}
    >
      <Stack gap='m'>
        <TextField label='Title' value={name} onChange={handleChangeName} />
        <Dropdown
          label='Category'
          options={CATEGORY_OPTIONS}
          defaultSelectedKey={category}
          onChange={handleChangeCategory}
        />
        <Stack gap='s1'>
          <span>Tags</span>
          <Stack horizontal gap='s2' verticalAlign='center'>
            {tags.map(tag => {
              return (
                <Stack key={tag} horizontal gap='s'>
                  <div
                    className={FontClassNames.small}
                    style={{
                      minWidth: 50,
                      maxWidth: 100,
                      border: `1px solid ${palette.neutralTertiary}`,
                      color: palette.neutralTertiary,
                      padding: spacing.s1,
                    }}
                  >
                    {tag}
                  </div>
                  <button
                    onClick={() => onDeleteTagCliked(tag)}
                    style={{ backgroundColor: 'Transparent', border: 'none' }}
                  >
                    <Icon iconName='Cancel' />
                  </button>
                </Stack>
              );
            })}
            <TextField
              value={tagEdit}
              styles={{ fieldGroup: { width: 80 } }}
              onChange={handleChangeTags}
            />
            <button
              onClick={onAddTagCliked}
              style={{ backgroundColor: 'Transparent', border: 'none' }}
            >
              <Icon iconName='Add' />
            </button>
          </Stack>
        </Stack>
        <TextField
          label='Introduction'
          value={introduction}
          onChange={handleChangeIntroduction}
        />
        <TextField label='Author' value={author} disabled />
        <TextField
          label='Description'
          value={description}
          multiline
          rows={20}
          onChange={handleChangeDescription}
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

EditMarketItem.contextType = Context;
