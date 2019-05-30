import React from 'react';
import { FormTextFiled } from './FormTextFiled';
import { FormPage } from './FormPage';
import { getFormClassNames } from './formStyle'
import { Text } from 'office-ui-fabric-react';

const { topForm } = getFormClassNames();

export const Parameter= () => {
  return (
    <div className={topForm}>
    <FormPage>
      <Text>Parameter</Text>
      <FormTextFiled label={'Job name'}/>
      <FormTextFiled label={'Virutual cluster'}/>
      <FormTextFiled label={'Retry count'}/>
    </FormPage>
    </div>
  );
}