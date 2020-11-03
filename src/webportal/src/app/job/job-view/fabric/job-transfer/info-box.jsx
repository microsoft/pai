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
  Stack,
  Text,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

function InfoBox({hidden, title, message, onDismiss, redirectURL}) {
  return (
    <Dialog
      hidden={hidden}
      modalProps={{
        isBlocking: true,
      }}
    >
       <Stack gap='m'>
          <Text variant='xLarge'>{title}</Text>
          <Text variant='large'>{message}</Text>
        </Stack>
      <DialogFooter>
        <PrimaryButton onClick={() => {
          onDismiss();
          if (redirectURL) {
            window.location.href = redirectURL;
          }
        }}>OK
        </PrimaryButton>
      </DialogFooter>
    </Dialog>
  )
}

export default InfoBox;

