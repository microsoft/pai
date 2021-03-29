// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import {
  PrimaryButton,
  DefaultButton,
  Dialog,
  DialogFooter,
  TextField,
  Label,
  ChoiceGroup,
  Dropdown,
  Stack,
} from 'office-ui-fabric-react';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isNil, cloneDeep } from 'lodash';
import { connect } from 'react-redux';
import { createTemplate, listMyGroups } from '../utils/conn';
import { Flex } from '../elements';
import { generateDefaultDescription } from '../utils/utils';

const user = cookies.get('user');

const PureSaveTemplateDialog = props => {
  const { hideDialog, toggleHideDialog, jobProtocol } = props;
  const [templateName, setTemplateName] = useState('');
  const [templateSummary, setTemplateSummary] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [groupList, setGroupList] = useState([]);
  const [templateDescription, setTemplateDescription] = useState(
    generateDefaultDescription(jobProtocol.name),
  );
  const [groupListOptions, setGroupListOpptions] = useState([]);

  useEffect(() => {
    listMyGroups(user).then(groups => {
      const options = [];
      for (const [index, group] of groups.entries()) {
        options.push({
          key: index.toString(),
          text: group.groupname,
        });
      }
      setGroupListOpptions(options);
    });
  }, []);

  const options = [
    { key: 'Private', text: 'Private' },
    { key: 'Public', text: 'Public' },
    {
      key: 'Protected',
      text: 'Protected',
      onRenderField: (props, render) => {
        return (
          <Stack
            horizontal
            verticalAlign='center'
            horizontalAlign='space-between'
            gap='s1'
          >
            {render(props)}
            <Dropdown
              placeholder='Select groups to share'
              options={groupListOptions}
              multiSelect
              // eslint-disable-next-line
              disabled={props ? !props.checked : false}
              styles={{ root: { minWidth: 200, maxWidth: 300 } }}
              onChange={(_, item) => {
                if (item) {
                  let newGroupList = cloneDeep(groupList);
                  newGroupList = item.selected
                    ? [...newGroupList, item.text]
                    : newGroupList.filter(text => text !== item.text);
                  setGroupList(newGroupList);
                }
              }}
            />
          </Stack>
        );
      },
    },
  ];
  const onChoiceChange = React.useCallback((ev, option) => {
    if (option.key === 'Private') {
      setIsPrivate(true);
      setIsPublic(false);
      setGroupList([]);
    }
    if (option.key === 'Public') {
      setIsPrivate(false);
      setIsPublic(true);
      setGroupList([]);
    }
    if (option.key === 'Protected') {
      setIsPrivate(false);
      setIsPublic(false);
    }
  }, []);

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
    template.isPrivate = isPrivate;
    template.isPublic = isPublic;
    template.author = user;
    template.groupList = groupList;
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
        <Label required>Share Option</Label>
        <ChoiceGroup
          defaultSelectedKey='Private'
          options={options}
          onChange={onChoiceChange}
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
          value={templateDescription}
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
