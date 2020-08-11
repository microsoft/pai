// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import PropTypes from 'prop-types';
import React from 'react';
import {
  Dialog,
  DialogFooter,
  DefaultButton,
  List,
  DialogType,
} from 'office-ui-fabric-react';

import c from 'classnames';
import t from '../../components/tachyons.scss';

export default function GuestWarning(props) {
  const { onClose, open, forbiddenMessage, groups } = props;

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      onDismiss={handleClose}
      hidden={!open}
      title='Forbidden Error'
      minWidth={600}
      maxWidth={700}
      dialogContentProps={{
        showCloseButton: false,
        type: DialogType.normal,
        styles: {
          title: { paddingBottom: '12px' },
        },
        title: <div className={c(t.f3)}>Forbidden Error</div>,
        subText: <div className={c(t.f4)}>{forbiddenMessage}</div>,
      }}
    >
      <div className={c(t.flex, t.w100, t.f5)}>
        <div className={c(t.flex, t.w20)}>Group name</div>
        <div className={c(t.flex, t.w20)}>External name</div>
        <div className={c(t.flex, t.w30)}>Description</div>
        <div className={c(t.flex, t.w30)}>virtual clusters</div>
      </div>
      <hr />
      <List
        items={groups}
        onRenderCell={group => (
          <div className={c(t.flex, t.w100, t.f5, t.h100)}>
            <div className={c(t.flex, t.w20)}>{group.groupname}</div>
            <div className={c(t.flex, t.w20)}>{group.externalName}</div>
            <div className={c(t.flex, t.w30)}>{group.description}</div>
            <div className={c(t.flex, t.w20)}>
              {group.extension.acls.virtualClusters.join()}
            </div>
            <div className={c(t.flex, t.itemsCenter, t.h100, t.w10)}>
              <DefaultButton
                styles={{
                  root: {
                    backgroundColor: '#428bca',
                    color: 'white',
                    height: '100%',
                  },
                }}
                text='Join'
                href={group.extension.acls.joinUrl}
              />
            </div>
          </div>
        )}
      />
      <DialogFooter>
        <DefaultButton onClick={handleClose} text='Close' />
      </DialogFooter>
    </Dialog>
  );
}

GuestWarning.propTypes = {
  onClose: PropTypes.func.isRequired,
  forbiddenMessage: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  groups: PropTypes.array.isRequired,
};
