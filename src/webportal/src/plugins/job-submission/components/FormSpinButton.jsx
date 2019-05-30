import React  from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { SpinButton} from 'office-ui-fabric-react';
import { getFromComponentsStyle } from './formStyle';
import { BasicSection } from './BasicSection';

export const FormSpinButton = (props) => {
  const {label, optional } = props;
  const textFieldId = getId('textField');

  return (
    <BasicSection label={label} optional={optional}>
      <SpinButton defaultValue="0" min={0} step={1}/>
    </BasicSection>
  );
}