// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState, useEffect } from 'react';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react';
import { connect } from 'react-redux';
import { cloneDeep, get } from 'lodash';
import PropTypes from 'prop-types';
import { Box } from '../elements';
import { JobProtocol } from '../../job-submission/models/job-protocol';
import { fetchMyPrivateTemplates, fetchPublicTemplates } from '../utils/conn';
import { FormItem } from './form-page';

const loginUser = cookies.get('user');

const PureTemplateSelection = props => {
  const { onJobProtocolChange, onCurrentTaskRoleChange } = props;
  const [templateOptions, setTemplateOptions] = useState([
    {
      key: 'No',
      text: 'No template',
      protocol: null,
    },
  ]);

  // fetch template options
  useEffect(() => {
    const newTemplateOptions = cloneDeep(templateOptions);
    fetchMyPrivateTemplates(loginUser).then(templates => {
      newTemplateOptions.push({
        key: 'MyTemplatesHeader',
        text: 'My Templates',
        itemType: DropdownMenuItemType.Header,
      });
      for (const template of templates) {
        newTemplateOptions.push({
          key: template.id,
          text: template.name,
          protocol: template.protocol,
        });
      }
      fetchPublicTemplates().then(publicTemplates => {
        newTemplateOptions.push({
          key: 'PublicTemplatesHeader',
          text: 'Public Templates',
          itemType: DropdownMenuItemType.Header,
        });
        for (const template of publicTemplates) {
          newTemplateOptions.push({
            key: template.id,
            text: template.name,
            protocol: template.protocol,
          });
        }
        setTemplateOptions(newTemplateOptions);
      });
    });
  }, []);

  const onTemplateChange = (_, item) => {
    if (item.key === 'No') {
      return;
    }
    const jobConfig = JobProtocol.fromYaml(item.protocol);

    onJobProtocolChange(new JobProtocol(jobConfig));
    onCurrentTaskRoleChange(Object.keys(get(jobConfig, 'taskRoles'))[0]);
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
  onCurrentTaskRoleChange: currentTaskRole =>
    dispatch({ type: 'SAVE_CURRENT_TASKROLE', payload: currentTaskRole }),
});

export const TemplateSelection = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTemplateSelection);

PureTemplateSelection.propTypes = {
  onJobProtocolChange: PropTypes.func,
  onCurrentTaskRoleChange: PropTypes.func,
};
