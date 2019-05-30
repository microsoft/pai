import React from 'react';
import { FormTextFiled } from './FormTextFiled';
import { FormPage } from './FormPage';
import { getFormClassNames } from './formStyle'
import { Text } from 'office-ui-fabric-react';

const { topForm } = getFormClassNames();

export const JobInformation= () => {
  return (
    <div className={topForm}>
    <FormPage>
      <Text>Job Information</Text>
      <FormTextFiled label={'Job name'}/>
      <FormTextFiled label={'Virutual cluster'}/>
      <FormTextFiled optional label={'Retry count'}/>
    </FormPage>
    </div>
  );
}