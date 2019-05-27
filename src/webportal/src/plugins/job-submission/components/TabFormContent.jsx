import React from 'react'
import { FormTextFiled } from './FormTextFiled'

export const TabContent = () => {
  return (
    <>
    <FormTextFiled label={'Task role name'} required placeholder={'Enter task role name...'}/>
    <FormTextFiled label={'Docker'} required placeholder={'Enter docker uri'}/>
    <FormTextFiled label={'Retry count'} required placeholder={'Enter GPU number...'}/>
    </>
  );
}