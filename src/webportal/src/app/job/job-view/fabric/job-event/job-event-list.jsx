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

import { DateTime } from 'luxon';
import {
  DetailsList,
  SelectionMode,
  DetailsListLayoutMode,
  FontClassNames,
  Text,
  Stack,
  Dialog,
  DialogFooter,
  PrimaryButton,
  CommandBarButton,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

const JobEventList = props => {
  const { jobEvents } = props;
  const [hideDialog, setHideDialog] = useState(true);
  const [dialogMessage, setDialogMessage] = useState(null);

  const toggleHideDialog = () => {
    setHideDialog(!hideDialog);
  };

  const columns = [
    {
      key: 'taskRoleName',
      name: 'Task Role Name',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>{item.taskroleName}</div>
        );
      },
    },
    {
      key: 'taskIndex',
      name: 'Task Index',
      maxWidth: 60,
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>{item.taskIndex}</div>
        );
      },
    },
    {
      key: 'type',
      name: 'Type',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.type}</div>;
      },
    },
    {
      key: 'reason',
      name: 'Reason',
      minWidth: 150,
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.reason}</div>;
      },
    },
    {
      key: 'message',
      name: 'message',
      headerClassName: FontClassNames.medium,
      minWidth: 550,
      maxWidth: 1000,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <Stack horizontal gap='m'>
            <Text styles={{ root: { maxWidth: 400 } }} nowrap>
              {item.message}
            </Text>
            <CommandBarButton
              className={FontClassNames.mediumPlus}
              styles={{
                root: { backgroundColor: 'transparent' },
                rootDisabled: { backgroundColor: 'transparent' },
              }}
              iconProps={{ iconName: 'TextDocument' }}
              text='Full Message'
              onClick={() => {
                toggleHideDialog();
                setDialogMessage(item.message);
              }}
            />
          </Stack>
        );
      },
    },
    {
      key: 'firstTimestamp',
      name: 'First Timestamp',
      minWidth: 160,
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>
            {DateTime.fromISO(item.firstTimestamp).toLocaleString(
              DateTime.DATETIME_SHORT,
            )}
          </div>
        );
      },
    },
    {
      key: 'lastTimestamp',
      name: 'Last Timestamp',
      headerClassName: FontClassNames.medium,
      minWidth: 160,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>
            {DateTime.fromISO(item.lastTimestamp).toLocaleString(
              DateTime.DATETIME_SHORT,
            )}
          </div>
        );
      },
    },
    {
      key: 'count',
      name: 'Count',
      maxWidth: 50,
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.count}</div>;
      },
    },
  ];

  return (
    <Stack>
      <DetailsList
        columns={columns}
        disableSelectionZone
        items={jobEvents}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
      <Dialog hidden={hideDialog} onDismiss={toggleHideDialog} minWidth='500px'>
        <Stack gap='m'>
          <Text variant='xLarge'>Event Message :</Text>
          <Text variant='large'>{dialogMessage}</Text>
        </Stack>
        <DialogFooter>
          <PrimaryButton onClick={toggleHideDialog} text='Close' />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};

JobEventList.propTypes = {
  jobEvents: PropTypes.arrayOf(PropTypes.object),
};

export default JobEventList;
