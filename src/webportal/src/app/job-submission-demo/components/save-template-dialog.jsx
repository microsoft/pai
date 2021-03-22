// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import {
  PrimaryButton,
  DefaultButton,
  Dialog,
  DialogFooter,
  TextField,
} from 'office-ui-fabric-react';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isNil, cloneDeep } from 'lodash';
import { connect } from 'react-redux';
import { createTemplate } from '../utils/conn';
import { Flex } from '../elements';

const user = cookies.get('user');

const PureSaveTemplateDialog = props => {
  const { hideDialog, toggleHideDialog, jobProtocol } = props;
  const [templateName, setTemplateName] = useState('');
  const [templateSummary, setTemplateSummary] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const saveTemplate = async event => {
    if (isNil(templateName) || templateName === '') {
      toggleHideDialog();
      alert('Template name is required!');
      return;
    }
    const protocol = cloneDeep(jobProtocol);
    const template = {};
    template.name = templateName;
    template.summary = templateSummary;
    template.description = templateDescription;
    template.protocol = protocol.toYaml();
    template.source = 'pai';
    template.type = 'template';
    template.isPrivate = true;
    template.author = user;
    try {
      await createTemplate(template);
      alert('create successfullly');
      toggleHideDialog();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <Dialog
      hidden={hideDialog}
      onDismiss={toggleHideDialog}
      dialogContentProps={{
        title: <span>Save to template</span>,
      }}
      minWidth={500}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 900 } },
      }}
    >
      <Flex flexDirection='column'>
        <TextField
          label={'name'}
          onChange={e => {
            setTemplateName(e.target.value);
          }}
          required={true}
        />
        <TextField
          label={'summary'}
          required={false}
          onChange={e => {
            setTemplateSummary(e.target.value);
          }}
          multiline
          rows={3}
        />
        <TextField
          label={'description'}
          required={false}
          onChange={e => {
            setTemplateDescription(e.target.value);
          }}
          multiline
          rows={10}
        />
      </Flex>
      <DialogFooter>
        <PrimaryButton text='Save' onClick={saveTemplate} />
        <DefaultButton text='Cancel' onClick={toggleHideDialog} />
      </DialogFooter>
    </Dialog>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = {};

export const SaveTemplateDialog = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureSaveTemplateDialog);

PureSaveTemplateDialog.propTypes = {
  hideDialog: PropTypes.bool,
  toggleHideDialog: PropTypes.func,
  jobProtocol: PropTypes.object,
};
