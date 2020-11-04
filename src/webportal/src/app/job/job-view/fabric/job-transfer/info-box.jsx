// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  Stack,
  Text,
  Dialog,
  DialogFooter,
  PrimaryButton,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';

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

InfoBox.propTypes = {
  hidden: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired,
  redirectURL: PropTypes.string,
};

export default InfoBox;
