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

import React, { useEffect, useState } from 'react';
import {
  DefaultButton,
  Dialog,
  DialogType,
  FontClassNames,
  FontSizes,
  Label,
  Separator,
  Stack,
  TextField,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';

export default function SaveTemplate({ hideDialog, toggleHideDialog }) {
  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={handleCancel}
      dialogContentProps={{
        type: DialogType.normal,
        title: (
          <span style={{ fontSize: FontSizes.icon }}>Save to template</span>
        ),
      }}
      minWidth={900}
      maxWidth={900}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 900 } },
      }}
    >
      <Stack
        horizontal
        padding='l1'
        gap='l1'
        styles={{ root: { width: 860 } }}
      ></Stack>
      <DialogFooter>
        <PrimaryButton text='Save' />
        <DefaultButton text='Cancel' />
      </DialogFooter>
    </Dialog>
  );
}

SaveTemplate.propTypes = {
  hideDialog: PropTypes.bool,
  toggleHideDialog: PropTypes.func,
};
