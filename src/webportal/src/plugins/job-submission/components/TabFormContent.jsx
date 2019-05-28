import React from 'react';
import { FormTextFiled, FormDockerSection, FormPortsList } from './FormComponents';
import { FormPage } from './FormPage';

const portList = [{}];

export const TabContent = () => {
  return (
    <FormPage>
      <FormTextFiled label={'Task role name'} required placeholder={'Enter task role name...'}/>
      <FormDockerSection></FormDockerSection>
      <FormTextFiled label={'Retry count'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Instance'} required placeholder={'Enter GPU number...'}/>
      <FormTextFiled label={'Task retry count'} placeholder={'Enter GPU number...'} suffixText='optional'/>
      <FormPortsList items={portList}></FormPortsList>
    </FormPage>
  );
}