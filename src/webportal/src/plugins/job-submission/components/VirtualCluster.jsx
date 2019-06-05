import React from 'react';
import {BasicSection} from './BasicSection';
import {Dropdown} from 'office-ui-fabric-react';
import {FormShortSection} from './FormPage';

export const VirtualCluster = () => {
  return (
    <BasicSection sectionLabel={'Virutual cluster'}>
      <FormShortSection>
        <Dropdown placeholder='Select an option'></Dropdown>
      </FormShortSection>
    </BasicSection>
  );
};
