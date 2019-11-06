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
import { FontSizes } from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';
import React, { useState, useContext } from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Dialog,
  DialogFooter,
  Dropdown,
  DialogType,
  TextField,
  Stack,
  Icon,
  Text,
  IStackProps,
  IDropdownOption,
} from 'office-ui-fabric-react';
import Context from './Context';
import {updateMarketItem} from './conn';

export default function EditMarketItem(props) {
  const {hideDialog, setHideDialog} = props;
  const {jobInfo} = useContext(Context);

  const [name, setName] = useState(jobInfo.name);
  const [category, setCategory] = useState(jobInfo.category);
  const [introduction, setIntroduction] = useState(jobInfo.introduction);
  const [author, setAuthor] = useState(jobInfo.author);
  const [description, setDescription] = useState(jobInfo.description);

  const CATEGORY_OPTIONS = [
    {key: 'custom',
     text: 'custom',
    },
    {key: 'category2',
     text: 'category2',
    },
  ];

  const item = {
     name: 'minist example',
     author: 'mintao',
     tags: ['tensorflow', 'minist'],
     category: 'custom',
     introduction: 'An example of minist model.',
     description: `### MINIST Example of OpenPAI Marketplace

     An example of MINIST model.
     
     #### Environments
     
     - Python 3.6
     - Tensorflow 1.12
     - Recommended docker image:  openpai/tensorflow-py36-cu90
     
     #### Steps
     
     - Download MINIST dataset:
     
     \`\`\`python
     python download.py
     \`\`\`
     
     - Classified with softmax regression:
     
     \`\`\`python
     python softmax_regression.py
     \`\`\`
     
     - Classified with convolution network:
     
     \`\`\`python
     python convolutional.py
     \`\`\`
     
     #### Reference
     
     - MNIST dataset: [link](http://yann.lecun.com/exdb/mnist/).`,
  };

  const columnProps = {
    tokens: {childrenGap: 15}
  }
  
  function onConfirm() {
    setHideDialog(true);
    // connect to rest-server confirm edit
    updateMarketItem(name, category, introduction, author, description);
  }

  function closeDialog() {
    setHideDialog(true);
  }

  function handleChangeName(e) {
    setName(e.target.value);
  }

  function handleChangeCategory(e) {
    setCategory(e.target.selectedKey);
  }

  function handleChangeIntroduction(e) {
    setIntroduction(e.target.value);
  }

  function handleChangeAuthor(e) {
    setAuthor(e.target.value);
  }

  function handleChangeDescription(e) {
    setDescription(e.target.value);
  }

  return (
    <Dialog
      hidden={hideDialog}
      onDismiss={closeDialog}
      minWidth={600}
      maxWidth={700}
      dialogContentProps={{
        type: DialogType.largeHeader,
        showCloseButton: false,
        styles: {
          title: { paddingBottom: '12px' },
        },
        title: (
          <span
          >
            <Icon
              iconName='Info'
              styles={{
                root: { marginRight: '6px'},
              }}
            />
            EditMarketItem
          </span>
        ),
      }}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 450 } }
      }}
    >
      {/*
      <div className="form-group edit-group">
        <div className="edit-group-item">Title
          <input id="editTitle" name="titleEdit" className="add-vc-fild form-control" placeholder=""/>
        </div>
        <div className="edit-group-item">Categories
          <Dropdown
            placeholder='Select a category'
            options={CATEGORY_OPTIONS}
          />        
        </div>
        <div className="edit-group-item">Languages
          <input id="editLanguage" name="languageEdit" className="add-vc-fild form-control" placeholder=""/>
        </div>
        <div className="edit-group-item">Author
          <input id="editAuthor" name="authorEdit" className="add-vc-fild form-control" placeholder=""/>
        </div>
        <div className="edit-group-item">Description
          <input id="editDescription" name="descriptionEdit" className="add-vc-fild form-control" placeholder=""/>
        </div>
      </div>
      */}
      <Stack {...columnProps}>
        <TextField label='Title' value={name} onChange = {handleChangeName} />
        <Stack>
        <Dropdown
            label='Category'
            options={CATEGORY_OPTIONS}
            defaultSelectedKey={category}
            onChange = {handleChangeCategory}
        />
        </Stack>
        <TextField label='Introduction' value={introduction} onChange = {handleChangeIntroduction}/>
        <TextField label='Author' value={author} onChnage = {handleChangeAuthor}/>
        <TextField label='Description' value={description} multiline rows={10} onChnage = {handleChangeDescription}/>
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