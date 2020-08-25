// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FontClassNames } from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import {
  Dialog,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
} from 'office-ui-fabric-react';
import CopyButton from '../../components/copy-button';

import t from '../../../../components/tachyons.scss';

const CopySucceeded = props =>
  props.copied ? <p style={{ color: 'green' }}>Copied succeeded!</p> : null;

CopySucceeded.propTypes = {
  copied: PropTypes.bool,
};

export default function GroupDetailDialog(props) {
  const { hideDialog, setHideDialog, vc, groups } = props;

  return (
    <Dialog
      minWidth='50%'
      hidden={hideDialog}
      onDismiss={() => setHideDialog(true)}
      styles={{ borderStyle: 'solid' }}
      dialogContentProps={{
        title: `Granted group of VC '${vc.name}'`,
      }}
    >
      <DetailsList
        columns={[
          {
            key: 'name',
            minWidth: 100,
            maxWidth: 150,
            name: 'Group name',
            isResizable: true,
            onRender(group) {
              return (
                <div
                  className={c(
                    t.flex,
                    t.itemsCenter,
                    t.h100,
                    FontClassNames.medium,
                  )}
                >
                  {group.groupname}
                </div>
              );
            },
          },
          {
            key: 'alias',
            minWidth: 180,
            maxWidth: 250,
            name: 'Group alias',
            isResizable: true,
            onRender(group) {
              return (
                <div className={c(t.flex, t.itemsCenter, t.h100)}>
                  <div className={FontClassNames.medium}>
                    {group.externalName}
                  </div>
                  <div className={c(t.flex, t.itemsCenter, t.h100)}>
                    <CopyButton
                      value={group.externalName}
                      hideTooltip={true}
                      callback={() => {
                        colProps.setCopied(group.externalName);
                      }}
                    />
                    <CopySucceeded
                      copied={colProps.copied === group.externalName}
                    />
                  </div>
                </div>
              );
            },
          },
          {
            key: 'description',
            minWidth: 180,
            name: 'Description',
            isResizable: true,
            onRender(group) {
              return (
                <div
                  className={c(
                    t.flex,
                    t.itemsCenter,
                    t.h100,
                    FontClassNames.medium,
                  )}
                >
                  {group.description}
                </div>
              );
            },
          },
        ]}
        disableSelectionZone
        items={groups}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
    </Dialog>
  );
}

GroupDetailDialog.propTypes = {
  hideDialog: PropTypes.bool.isRequired,
  setHideDialog: PropTypes.func.isRequired,
  vc: PropTypes.object,
  groups: PropTypes.array,
};
