import React, { useState, useEffect } from 'react';
import { FormTextFiled } from './FormTextFiled';
import { FormDockerSection } from './FormDockerSection';
import { FormPortsList } from './FormPortsList';
import { FormPage } from './FormPage';
import { Port } from '../models/port';

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

  const onPortAdd = () => {
    const {ports} = jobTaskRole;
    ports.push(new Port());
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
                     placeholder={'Enter task role name...'}
                     value={jobTaskRole.name}
                     onChange={value=>onValueChange('name', value)}/>
      <FormDockerSection dockerInfo={jobTaskRole.dockerInfo}
                         onValueChange={ dockerInfo=>onValueChange('dockerInfo', dockerInfo)}>
      </FormDockerSection>
      <FormTextFiled label={'Retry count'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Instance'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Task retry count'} placeholder={'Enter GPU number...'} suffixText='optional'/>
      <FormPortsList ports={jobTaskRole.ports} onPortAdd={onPortAdd} onPortDelete={onPortDelete} onPortChange={onPortChange}></FormPortsList>
    </FormPage>
  );
}