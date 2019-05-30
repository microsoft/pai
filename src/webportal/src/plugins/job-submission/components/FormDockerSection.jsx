import React from 'react';
import { TextField, DefaultButton, Stack } from 'office-ui-fabric-react';
import { getId } from 'office-ui-fabric-react/lib/Utilities'
import { getFromComponentsStyle } from './formStyle';
import PropTypes from 'prop-types';
import { DockerInfo } from '../models/dockerInfo'
import { BasicSection } from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

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
    <BasicSection label={'Docker'}>
    <Stack horizontal gap={'4px'} styles={{root: {width: '85%'}}} >
      <TextField id={textFieldId}
                   placeholder='Enter docker uri...'
                   styles={formComponentsStyles.textFiled}
                   onChange={onDockerUriChange}
                   value={dockerInfo.uri}/>
      <DefaultButton>Auth</DefaultButton>
    </Stack>
  </BasicSection>
  );
}

FormDockerSection.propTypes = {
  dockerInfo: PropTypes.instanceOf(DockerInfo).isRequired,
  onValueChange: PropTypes.func,
};