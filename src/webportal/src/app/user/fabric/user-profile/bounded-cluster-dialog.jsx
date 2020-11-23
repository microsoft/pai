// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import {
  DefaultButton,
  PrimaryButton,
  DialogType,
  Dialog,
  DialogFooter,
  TextField,
} from 'office-ui-fabric-react';

import t from '../../../components/tachyons.scss';
import Joi from 'joi-browser';
import { PAIV2 } from '@microsoft/openpai-js-sdk';

const validateInput = async (clusterAlias, clusterUri, username, token) => {
  const inputSchema = Joi.object()
    .keys({
      alias: Joi.string()
        .regex(/^[A-Za-z0-9\-_]+$/)
        .required(),
      uri: Joi.string()
        .uri()
        .required(),
      username: Joi.string().required(),
      token: Joi.string()
        .trim()
        .required(),
    })
    .required();
  const input = {
    alias: clusterAlias,
    uri: clusterUri,
    username: username,
    token: token,
  };
  const { error, value } = Joi.validate(input, inputSchema);
  if (error) {
    throw new Error(error);
  }

  const client = new PAIV2.OpenPAIClient({
    rest_server_uri: new URL('rest-server', value.uri),
    username: value.username,
    token: value.token,
    https: value.uri.startsWith('https'),
  });

  // check if token is valid
  try {
    await client.virtualCluster.listVirtualClusters();
  } catch (err) {
    throw new Error(
      `Try to connect the cluster but failed. Details: ${err.message}. Please check the error message in your browser console for more information.`,
    );
  }

  return value;
};

const BoundedClusterDialog = ({ onDismiss, onAddBoundedCluster }) => {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [clusterAlias, setClusterAlias] = useState('');
  const [clusterUri, setClusterUri] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');

  const onAddAsync = async () => {
    const clusterConfig = await validateInput(
      clusterAlias,
      clusterUri,
      username,
      token,
    );
    await onAddBoundedCluster(clusterConfig);
  };

  const onAdd = () => {
    setProcessing(true);
    onAddAsync()
      .then(
        // If successful, close this dialog
        () => onDismiss(),
      )
      .catch(
        // If error, show the error, and don't close this dialog
        e => {
          console.error(e);
          setError(e.message);
        },
      )
      .finally(() => setProcessing(false));
  };

  return (
    <div>
      <Dialog
        hidden={false}
        onDismiss={onDismiss}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Add a Bounded Cluster',
        }}
        modalProps={{
          isBlocking: true,
        }}
        minWidth={600}
      >
        <div>
          <div className={t.mt1}>
            <TextField
              label='Cluster Alias (Only A-Z, a-z, 0-9, - and _ are allowed):'
              value={clusterAlias}
              onChange={e => setClusterAlias(e.target.value)}
            />
          </div>
          <div className={t.mt1}>
            <TextField
              label='Cluster URI (Starts with http:// or https://):'
              value={clusterUri}
              onChange={e => setClusterUri(e.target.value)}
            />
          </div>
          <div className={t.mt1}>
            <TextField
              label='Your username on this cluster:'
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className={t.mt1}>
            <TextField
              label='Token:'
              value={token}
              onChange={e => setToken(e.target.value)}
              multiline
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <PrimaryButton onClick={onAdd} disabled={processing} text='Add' />
          <DefaultButton
            onClick={onDismiss}
            disabled={processing}
            text='Cancel'
          />
        </DialogFooter>
      </Dialog>
      <Dialog
        hidden={isEmpty(error)}
        onDismiss={() => setError('')}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Error',
          subText: error,
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <DialogFooter>
          <DefaultButton onClick={() => setError('')}>OK</DefaultButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

BoundedClusterDialog.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  onAddBoundedCluster: PropTypes.func.isRequired,
};

export default BoundedClusterDialog;
