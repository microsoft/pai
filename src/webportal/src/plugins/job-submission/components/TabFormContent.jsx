import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormTextFiled } from './FormTextFiled';
import { FormDockerSection } from './FormDockerSection';
import { PortsList } from './PortsList';
import { FormPage } from './FormPage';
import { JobTaskRole } from '../models/jobTaskRole';
import { Completion } from './Completion';
import { Deployment } from './Deployment';
import { FormSpinButton } from './FormSpinButton';

const updateTaskRoleProperty = (jobTaskRoleState, setJobTaskRoleState, propertyName, propertyValue) => {
  const udpatedJobTaskRole = {...jobTaskRoleState};
  udpatedJobTaskRole[propertyName] = propertyValue;
  setJobTaskRoleState(udpatedJobTaskRole);
}

export const TabFormContent = (props) => {
  const { jobTaskRole, onContentChange } = props;
  // Use for udpate, can not be used for component input
  const [jobTaskRoleState, setJobTaskRoleState] = useState(jobTaskRole);
  const onValueChange = updateTaskRoleProperty.bind(this, jobTaskRole, setJobTaskRoleState);
  useEffect(()=>{ onContentChange(jobTaskRoleState);}, [jobTaskRoleState]);

  const onPortAdd = (port) => {
    const {ports} = jobTaskRole;
    ports.push(port);
    onValueChange('ports', ports);
  };
  const onPortDelete = (index) => {
    let {ports} = jobTaskRole;
    ports = ports.filter((_, itemIndex) => index !== itemIndex);
    onValueChange('ports', ports);
  };
  const onPortChange = (index, port) => {
    const {ports} = jobTaskRole;
    ports[index] = port;
    onValueChange('ports', ports);
  }


  return (
    <FormPage>
      <FormTextFiled label={'Task role name'}
                     required
                     value={jobTaskRole.name}
                     onChange={value=>onValueChange('name', value)}
                     textFiledProps={{placeholder: 'Enter task role name...'}}/>
      <FormDockerSection dockerInfo={jobTaskRole.dockerInfo}
                         onValueChange={ dockerInfo=>onValueChange('dockerInfo', dockerInfo)}>
      </FormDockerSection>
      <FormSpinButton label={'Instance'} textFiledProps={{placeholder: 'Enter instance number...'}}/>
      <PortsList ports={jobTaskRole.ports} onPortAdd={onPortAdd} onPortDelete={onPortDelete} onPortChange={onPortChange}></PortsList>
      <FormSpinButton label={'Task retry count'} optional/>
      <Completion/>
      <FormTextFiled label={'Command'} textFiledProps={{multiline: true, rows: 10}}/>
      <Deployment/>
    </FormPage>
  );
}

TabFormContent.protoTypes = {
  jobTaskRole: PropTypes.instanceOf(JobTaskRole).required,
  onContentChange: PropTypes.func,
}