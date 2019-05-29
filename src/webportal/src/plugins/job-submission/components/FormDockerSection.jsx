import React from 'react';
import { Label, TextField, PrimaryButton } from 'office-ui-fabric-react';
import { getId } from 'office-ui-fabric-react/lib/Utilities'
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle } from './formStyle';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

import { DockerInfo } from '../models/dockerInfo'

export const FormDockerSection = (props) => {
  const textFieldId = getId('textField');
  const { onValueChange, dockerInfo } = props;

  const onDockerUriChange = (_, value) => {
    if (onValueChange == undefined) {
      return;
    }

    const dockerInfo = new DockerInfo();
    dockerInfo.uri = value;
    onValueChange(dockerInfo);
  };

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label htmlFor={textFieldId} required styles={formComponentsStyles.label}>Docker</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <TextField id={textFieldId}
                   placeholder='Enter docker uri...'
                   styles={formComponentsStyles.textFiled}
                   onChange={onDockerUriChange}
                   value={dockerInfo.uri}/>
        <span><PrimaryButton>Auth</PrimaryButton></span>
      </FormColumn>
    </FormSection>
  );
}