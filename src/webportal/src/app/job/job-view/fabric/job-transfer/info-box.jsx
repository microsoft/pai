// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  Stack,
  Text,
  Dialog,
  DialogFooter,
  PrimaryButton,
} from 'office-ui-fabric-react';
import React, { useState } from 'react';

function InfoBox({ hidden, title, message, onDismiss, redirectURL }) {
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
        <PrimaryButton
          onClick={() => {
            onDismiss();
            if (redirectURL) {
              window.location.href = redirectURL;
            }
          }}
        >
          OK
        </PrimaryButton>
      </DialogFooter>
    </Dialog>
  );
}

export default InfoBox;
