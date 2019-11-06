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
import React from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Dialog,
  DialogType,
  DialogFooter,
  Icon,
} from 'office-ui-fabric-react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';

import t from '../../components/tachyons.scss';

export default function DeleteMarketItem(props) {
  const {hideDeleteDialog, setHideDeleteDialog} = props;

  function onConfirm() {
    setHideDeleteDialog(true);
    // do something to confirm edit

  }

  function closeDialog() {
    setHideDeleteDialog(true);
  }

  return (
    <Dialog
      hidden={hideDeleteDialog}
      onDismiss={closeDialog}
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
            DeleteMarketItem
          </span>
        ),
        subText: "confirm to delete permanently?",
      }}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 450 } }
      }}
      >
        <DialogFooter>
          <PrimaryButton onClick={onConfirm} text='Confirm' />
          <DefaultButton onClick={closeDialog} text='Cancel' />
        </DialogFooter>
      </Dialog>
  );
}

DeleteMarketItem.propTypes = {
  hideDeleteDialog: PropTypes.bool.isRequired,
  setHideDeleteDialog: PropTypes.func.isRequired,
};