import React, { useState, useEffect } from 'react';
import { FormTextFiled, FormDockerSection, FormPortsList } from './FormComponents';
import { FormPage } from './FormPage';
import { DockerInfo } from '../models/dockerInfo';
import yaml from 'js-yaml';

const portList = [{}];

export const TabContent = (props) => {
  const { jobTaskRole, onContentChange } = props;
  const [dockerInfo, setDockerInfo] = useState(jobTaskRole.dockerInfo);

  // useEffect(()=>{ onContentChange(dockerInfo);}, [dockerInfo]);
  console.log(yaml.safeDump(dockerInfo));

  return (
    <FormPage>
      <FormTextFiled label={'Task role name'} required placeholder={'Enter task role name...'}/>
      <FormDockerSection dockerInfo={dockerInfo}
                         onValueChange={
                           (dockerInfo)=>{
                           setDockerInfo(dockerInfo);
                         onContentChange(dockerInfo);
                         }}>
      </FormDockerSection>
      <FormTextFiled label={'Retry count'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Instance'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Task retry count'} placeholder={'Enter GPU number...'} suffixText='optional'/>
      <FormPortsList items={portList}></FormPortsList>
    </FormPage>
  );
}