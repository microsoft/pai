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
import React, { useCallback, useContext } from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Dialog,
  DialogType,
  DialogFooter,
  FontClassNames,
  FontSizes,
  FontWeights,
  Text,
} from 'office-ui-fabric-react';

import Context from '../Context';

export default function DeleteMarketItem(props) {
  const { hideDeleteDialog, setHideDeleteDialog } = props;
  const { api, marketItem, history } = useContext(Context);

  async function onConfirm() {
    setHideDeleteDialog(true);
    // connect to db to delete item using name(temporary).
    try {
      await deleteItem();
      setHideDeleteDialog(true);
    } catch (err) {
      setHideDeleteDialog(true);
      alert(err);
    }
    // window.location.href = `/market-list.html`;
    history.push('/');
  }

  async function deleteItem() {
    const url = `${api}/api/v2/marketplace/items/${marketItem.id}`;
    const res = await fetch(url, {
      method: 'DELETE',
    });
    const text = await res.text();
    if (res.ok) {
      return text;
    } else {
      throw new Error(text);
    }
  }

  const closeDialog = useCallback(() => {
    setHideDeleteDialog(true);
  });

  return (
    <Dialog
      hidden={hideDeleteDialog}
      onDismiss={closeDialog}
      minWidth={400}
      maxWidth={400}
      dialogContentProps={{
        type: DialogType.normal,
        title: (
          <Text
            styles={{
              root: {
                fontSize: FontSizes.large,
                fontWeight: FontWeights.semibold,
              },
            }}
          >
            Delete Item !
          </Text>
        ),
        subText: (
          <span className={FontClassNames.medium}>
            Do you want to delete this market item permanently?
          </span>
        ),
      }}
      modalProps={{
        isBlocking: true,
        styles: { main: { maxWidth: 450 } },
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
