import React from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { Label, TextField, PrimaryButton, Stack, Text } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle, marginSize } from './formStyle';
import { KeyValueList } from './KeyValueList';
import { DockerInfo } from '../models/dockerInfo';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const FormTextFiled = (props) => {
  const {label, required, placeholder, suffixText} = props;
  const textFieldId = getId('textField');

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label htmlFor={textFieldId} required={required} styles={formComponentsStyles.label}>{label}</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <Stack horizontal gap={marginSize.s1}>
          <TextField id={textFieldId} placeholder={placeholder} styles={formComponentsStyles.textFiled}/>
          <Text styles={formComponentsStyles.suffixText}>{suffixText}</Text>
        </Stack>
      </FormColumn>
    </FormSection>
  );
}

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

export const FormPortsList = (props) => {
  const { items } = props;
  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label styles={formComponentsStyles.label}>Ports</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <KeyValueList items={items}/>
      </FormColumn>
    </FormSection>
  );
}