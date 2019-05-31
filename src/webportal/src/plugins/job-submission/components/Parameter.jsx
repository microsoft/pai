import React, { useState } from 'react';
import { getFormClassNames } from './formStyle'
import { Text, DetailsList, CheckboxVisibility, Stack, ActionButton } from 'office-ui-fabric-react';
import { KeyValueList } from './KeyValueList';

const { topForm } = getFormClassNames();

const columns = [{ key: 'column1', name: 'Key', fieldName: 'itemKey' },
                 { key: 'column2', name: 'Value', fieldName: 'itemValue'}];

export const Parameter= () => {
  const [isParameterOn, setParameterOn] = useState(false);
  const [iconName, setIconName] = useState('ChevronDown');
  const onClick = () => {
    if (!isParameterOn) {
      setIconName('ChevronUp');
    } else {
      setIconName('ChevronDown');
    }
    setParameterOn(!isParameterOn);
  }

  return (
    <div className={topForm}>
    <Stack>
      <Stack horizontal>
        <Text>Parameter</Text>
        <ActionButton iconProps={{iconName: iconName}} styles={{flexContainer: {alignItems: 'end', height: 'auto'}, root: {height: 'auto'}}} onClick={onClick}/>
      </Stack>
      {
        !isParameterOn && <Text>you could use these predefined parameters as command variables with prefix '$'</Text>
      }
      {
        isParameterOn && 
        <>
          <KeyValueList items={[]}/>
          <Text>Environment</Text>
          <DetailsList items={[]} columns={columns} checkboxVisibility={CheckboxVisibility.hidden} compact/>
        </>
      }
    </Stack>
    </div>
  );
}