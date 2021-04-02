// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Box, Code } from '../../elements';
import { FormSection } from '../form-page';
import { KeyValueList, getItemsWithError } from '../controls/key-value-list';
import { JobProtocol } from '../../models/job-protocol';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';

const PureSecrets = ({ jobProtocol, onJobProtocolChange }) => {
  const { secrets } = jobProtocol;
  const [items, setItems] = useState([]);

  useEffect(() => {
    const newItems = Object.keys(secrets).reduce((items, key) => {
      items.push({ key: key, value: secrets[key] });
      return items;
    }, []);
    if (newItems.length === 0) newItems.push({ key: '', value: '' });
    setItems(newItems);
  }, [secrets]);

  const onListChange = newItems => {
    const itemsWithError = getItemsWithError(newItems);
    const idx = itemsWithError.findIndex(
      item => item.keyError || item.valueError,
    );
    if (idx === -1) {
      const newItems = itemsWithError.reduce((items, item) => {
        items[item.key] = item.value;
        return items;
      }, {});
      // update job protocol into store
      onJobProtocolChange(
        new JobProtocol({ ...jobProtocol, secrets: newItems }),
      );
      // handleError(false);
      // setErrorMessage(ERROR_ID, null);
    } else {
      setItems(itemsWithError);
      // handleError(true);
      // setErrorMessage(ERROR_ID, `Invalid item ${idx}`);
    }
  };

  return (
    <FormSection title='Secrets' tooltip={PROTOCOL_TOOLTIPS.secrets}>
      <Box>
        <Box fontSize='s2'>
          Secret is a special type of parameter which will be masked after
          submission. You could reference these secrets in command by{' '}
          <Code color='dark-red' bg='black-05'>
            {'<% $secrets.secretKey %>'}
          </Code>
          .
        </Box>
      </Box>
      <Box>
        <KeyValueList items={items} onChange={onListChange} />
      </Box>
    </FormSection>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const Secrets = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureSecrets);

PureSecrets.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
