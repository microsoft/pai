// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import PropTypes from 'prop-types';
import React, { useState, useRef, useMemo } from 'react';
import {
  DetailsList,
  CheckboxVisibility,
  SelectionMode,
  DetailsListLayoutMode,
  IconButton,
  Stack,
  CommandBarButton,
  getTheme,
  Dialog,
  DialogType,
  TextField,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  SpinButton,
  FontClassNames,
} from 'office-ui-fabric-react';

const PORT_LABEL_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const PortsList = ({ onChange, ports }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [label, setLabel] = useState('');
  const [currentIdx, setCurrentIdx] = useState();
  const countRef = useRef();

  const onRemove = idx => {
    onChange('ports', [...ports.slice(0, idx), ...ports.slice(idx + 1)]);
  };

  const onEdit = idx => {
    setCurrentIdx(idx);
    setLabel(ports[idx].key);
    setShowDialog(true);
  };

  const onDialogSave = () => {
    if (currentIdx == null) {
      onChange('ports', [
        ...ports,
        { key: label, value: countRef.current.value },
      ]);
    } else {
      onChange('ports', [
        ...ports.slice(0, currentIdx),
        { key: label, value: countRef.current.value },
        ...ports.slice(currentIdx + 1),
      ]);
    }
    setLabel('');
    setCurrentIdx(null);
    setShowDialog(false);
  };

  const onDialogDismiss = () => {
    setLabel('');
    setCurrentIdx(null);
    setShowDialog(false);
  };

  const labelErrorMessage = useMemo(() => {
    if (!PORT_LABEL_REGEX.test(label)) {
      return 'Should be string in ^[a-zA-Z_][a-zA-Z0-9_]*$ format';
    }
    const idx = ports.findIndex(item => item.key === label);
    if (idx !== -1 && idx !== currentIdx) {
      return 'Duplicated port label';
    }
    return null;
  }, [label]);

  const columns = [
    {
      key: 'name',
      name: 'Port Label',
      minWidth: 60,
      className: FontClassNames.mediumPlus,
      onRender: item => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {item.key}
        </div>
      ),
    },
    {
      key: 'value',
      name: 'Count',
      minWidth: 50,
      className: FontClassNames.mediumPlus,
      onRender: item => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {item.value}
        </div>
      ),
    },
    {
      key: 'action',
      name: 'Action',
      minWidth: 100,
      onRender: (item, idx) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            height: '100%',
          }}
        >
          <Stack horizontal gap='s1'>
            <IconButton
              iconProps={{ iconName: 'Edit' }}
              onClick={() => onEdit(idx)}
            />
            <IconButton
              iconProps={{ iconName: 'Delete' }}
              onClick={() => onRemove(idx)}
            />
          </Stack>
        </div>
      ),
    },
  ];

  const { spacing } = getTheme();

  return (
    <Stack gap='m'>
      <div>
        <DetailsList
          items={ports}
          columns={columns}
          checkboxVisibility={CheckboxVisibility.hidden}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          compact
        />
      </div>
      <div>
        <CommandBarButton
          styles={{ root: { padding: spacing.s1 } }}
          iconProps={{ iconName: 'Add' }}
          onClick={() => setShowDialog(true)}
        >
          Add
        </CommandBarButton>
        <Dialog
          hidden={!showDialog}
          onDismiss={onDialogDismiss}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Add port',
          }}
          modalProps={{
            isBlocking: true,
          }}
          minWidth={400}
        >
          <Stack gap='m'>
            <div>
              <p>The port value will be assigned randomly.</p>
              <p>
                <div>
                  {`You can get the assigned port value (comma separated list if count > 1) through the environment variable:`}
                </div>
                <code>PAI_PORT_LIST_$taskRole_$taskIndex_$portLabel</code>
              </p>
            </div>
            <div>
              <TextField
                label='Port Label'
                value={label}
                onChange={(e, val) => setLabel(val)}
                errorMessage={labelErrorMessage}
              />
            </div>
            <div>
              <SpinButton
                label='Count'
                labelPosition='Top'
                defaultValue={currentIdx != null && ports[currentIdx].value}
                min={1}
                max={100}
                step={1}
                componentRef={countRef}
              />
            </div>
          </Stack>
          <DialogFooter>
            <PrimaryButton
              onClick={onDialogSave}
              text='Save'
              disabled={labelErrorMessage}
            />
            <DefaultButton onClick={onDialogDismiss} text='Cancel' />
          </DialogFooter>
        </Dialog>
      </div>
    </Stack>
  );
};

PortsList.propTypes = {
  ports: PropTypes.array,
  onChange: PropTypes.func,
};
