import React  from 'react';
import { SpinButton} from 'office-ui-fabric-react';
import { BasicSection } from './BasicSection';

export const FormSpinButton = (props) => {
  const {label, optional } = props;

  return (
    <BasicSection label={label} optional={optional}>
      <SpinButton defaultValue="0" min={0} step={1}/>
    </BasicSection>
  );
}