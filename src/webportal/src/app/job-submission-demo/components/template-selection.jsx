// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState, useEffect } from 'react';
import { Dropdown } from 'office-ui-fabric-react';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';
import { Flex, Box } from '../elements';
import { JobProtocol } from '../../job-submission/models/job-protocol';
import { fetchMyTemplates } from '../utils/conn';
import { FormSection, FormItem } from './form-page';

const loginUser = cookies.get('user');

const PureTemplateSelection = props => {
  const { onJobProtocolChange } = props;
  const [templateOptions, setTemplateOptions] = useState([
    {
      key: 'No',
      text: 'No template',
      protocol: null,
    },
  ]);

  // fetch template options
  useEffect(() => {
    fetchMyTemplates(loginUser).then(templates => {
      const newTemplateOptions = cloneDeep(templateOptions);
      for (const template of templates) {
        newTemplateOptions.push({
          key: template.id,
          text: template.name,
          protocol: template.protocol,
        });
      }
      setTemplateOptions(newTemplateOptions);
    });
  }, []);

  const onTemplateChange = (_, item) => {
    if (item.key === 'No') {
      return;
    }
    const jobConfig = JobProtocol.fromYaml(item.protocol);

    onJobProtocolChange(new JobProtocol(jobConfig));
  };

  return (
    <Box p='m' maxWidth='400px'>
      <FormItem label='Template Selection'>
        <Dropdown
          onChange={onTemplateChange}
          placeholder='Select a saved template'
          options={templateOptions}
        />
      </FormItem>
    </Box>
  );
};

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const TemplateSelection = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTemplateSelection);

PureTemplateSelection.propTypes = {
  onJobProtocolChange: PropTypes.func,
};
