import React, { useState, useEffect } from 'react';
import { FormTextFiled } from './FormComponents';
import { FormDockerSection } from './FormDockerSection';
import { FormPortsList } from './FormPortsList';
import { FormPage } from './FormPage';

const portList = [{}];

// const onContentChange()

export const TabFormContent = (props) => {
  const { jobTaskRole, onContentChange } = props;
  const [dockerInfo, setDockerInfo] = useState(jobTaskRole.dockerInfo);

  useEffect(()=>{ onContentChange(dockerInfo);}, [dockerInfo]);

  return (
    <FormPage>
      <FormTextFiled label={'Task role name'} required placeholder={'Enter task role name...'}/>
      <FormDockerSection dockerInfo={jobTaskRole.dockerInfo}
                         onValueChange={ dockerInfo=>setDockerInfo(dockerInfo)}>
      </FormDockerSection>
      <FormTextFiled label={'Retry count'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Instance'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Task retry count'} placeholder={'Enter GPU number...'} suffixText='optional'/>
      <FormPortsList items={portList}></FormPortsList>
    </FormPage>
  );
}